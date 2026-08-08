"""
AI Investigator router.

This is the core of OpenCase's prompt engineering demonstration.
Each investigation mode uses a carefully crafted prompt that shapes
how the AI frames its analysis.
"""

import asyncio
import json
import os
feature/ai-endpoint-validation
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field, field_validator
import google.generativeai as genai

import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
main

router = APIRouter()

# ─── Gemini setup ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-1.5-flash"
GEMINI_TIMEOUT_SECONDS = 15.0


# ─── Rate limiting ────────────────────────────────────────────────────────────
RATE_LIMIT = 10          # requests
RATE_WINDOW = 60         # seconds
_request_log: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    _request_log[client_ip] = [t for t in _request_log[client_ip] if now - t < RATE_WINDOW]
    if len(_request_log[client_ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again shortly.")
    _request_log[client_ip].append(now)


# ─── Request/Response models ──────────────────────────────────────────────────
VALID_MODES = {"detective", "scientist", "journalist", "historian"}


class InvestigatorRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=500)
    case_id: str = Field(..., min_length=1)
    mode: str = "detective"

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty or whitespace only")
        return v.strip()

    @field_validator("mode")
    @classmethod
    def mode_valid(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in VALID_MODES:
            raise ValueError(f"Mode must be one of: {', '.join(sorted(VALID_MODES))}")
        return v


class TheoryBuildRequest(BaseModel):
    case_id: str = Field(..., min_length=1)
    user_theory: str = Field(..., min_length=20, max_length=1000)

    @field_validator("user_theory")
    @classmethod
    def theory_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Theory cannot be empty or whitespace only")
        return v.strip()


class CompareTheoriesRequest(BaseModel):
    case_id: str = Field(..., min_length=1)
    theory_a: str = Field(..., min_length=10, max_length=1000)
    theory_b: str = Field(..., min_length=10, max_length=1000)

    @field_validator("theory_a", "theory_b")
    @classmethod
    def theory_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Theory cannot be empty or whitespace only")
        return v.strip()


# ─── INVESTIGATION MODE PROMPT TEMPLATES ─────────────────────────────────────
MODE_SYSTEM_PROMPTS = {
    "detective": """You are a seasoned homicide and cold-case detective analyzing an unsolved case.
Your job is to reason about suspects, motives, opportunity, and the sequence of events.
Focus on: Who could have done this? What was their motive? What physical evidence points to them?
When evidence is ambiguous, say so. When a suspect has been cleared, say why.
Always distinguish between facts and deductions. Never present guesswork as established truth.
Format your response with these exact sections:
## Key Suspects / Actors
## Motive Analysis
## Opportunity & Means
## Critical Evidence
## Lead Theory
## What Investigators Need to Prove""",

    "scientist": """You are a forensic scientist and evidence analyst reviewing a case file.
Your job is to assess the quality of evidence, identify what can and cannot be scientifically established,
and quantify uncertainty honestly. Avoid speculation. Flag where data is missing or contaminated.
Focus on: What does the physical evidence actually prove? Where does uncertainty exist?
Always cite why a piece of evidence is reliable or unreliable.
Format your response with these exact sections:
## Evidence Quality Assessment
## What the Science Confirms
## What the Science Cannot Confirm
## Key Uncertainties & Data Gaps
## Alternative Hypotheses Consistent with Evidence
## Conclusion (with confidence level: Low / Medium / High)""",

    "journalist": """You are an investigative journalist writing a neutral, fact-based report on an unsolved case.
Your job is to present what is known, what is disputed, and what remains unknown — without taking sides.
Use plain, accessible language. Attribute claims to their sources. Signal when something is alleged vs. confirmed.
Never sensationalize. Never editorialize. Report only what evidence supports.
Format your response with these exact sections:
## What Happened (Confirmed Facts)
## What Is Disputed
## What Remains Unknown
## Key Sources and Their Claims
## The Official Position
## What Investigators Say is Needed""",

    "historian": """You are a historian specializing in this period, region, and type of event.
Your job is to place this case in its full historical context — social, political, technological, institutional.
Explain what was happening in the world at the time that might be relevant.
Discuss how similar events have been handled historically and what precedents exist.
Format your response with these exact sections:
## Historical Context
## Parallel Cases in History
## Institutional & Political Factors
## How This Event Changed Policy or Understanding
## The Long-Term Historical Significance
## What History Tells Us About Cases Like This"""
}

UNIVERSAL_RULES = """
IMPORTANT RULES (apply these in every response, regardless of mode):
- Never present speculation as established fact.
- Never sensationalize or use dramatic language.
- If something is unknown, say it is unknown.
- If sources disagree, report the disagreement.
- If evidence is circumstantial, label it as such.
- Do not claim certainty where none exists.
"""


def load_case(case_id: str) -> dict:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    path = os.path.join(data_dir, f"{case_id}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def get_case_or_404(case_id: str) -> dict:
    case = load_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return case


def build_context_from_case(case: dict) -> str:
    known = "\n".join(f"- {f}" for f in case.get("known_facts", []))
    unknowns = "\n".join(f"- {u}" for u in case.get("unknowns", []))
    evidence = "\n".join(
        f"- {e['title']} (Source: {e['source']}, Reliability: {e['reliability']})"
        for e in case.get("evidence", [])
    )
    return f"""
=== CASE FILE: {case['name']} ===
Date: {case['date']}
Location: {case['location']}
Status: {case['status']}

KNOWN FACTS:
{known}

UNANSWERED QUESTIONS:
{unknowns}

EVIDENCE ON RECORD:
{evidence}
=== END CASE FILE ===
"""


def _call_gemini_sync(system_prompt: str, user_message: str) -> str:
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt
    )
    response = model.generate_content(user_message)
    return response.text


async def call_gemini(system_prompt: str, user_message: str) -> str:
    """Call Gemini with a timeout. Falls back to a mock response if no API key."""
    if not GEMINI_API_KEY:
        return _mock_response(user_message)

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_sync, system_prompt, user_message),
            timeout=GEMINI_TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="The AI service took too long to respond. Please try again."
        )


def _mock_response(question: str) -> str:
    return f"""## Mock Response (No API Key)

This is a placeholder response for: "{question}"

To enable real AI responses, add your GEMINI_API_KEY to the backend .env file.
Get a free key at: https://aistudio.google.com/app/apikey

The actual AI Investigator will respond with structured sections tailored to
the selected investigation mode (Detective, Scientist, Journalist, or Historian).
"""


# ─── ENDPOINTS ───────────────────────────────────────────────────────────────

@router.post("/ask", dependencies=[Depends(check_rate_limit)])
async def ask_investigator(request: InvestigatorRequest):
    case = get_case_or_404(request.case_id)

    system_prompt = (
        MODE_SYSTEM_PROMPTS[request.mode]
        + "\n\n"
        + UNIVERSAL_RULES
        + "\n\n"
        + build_context_from_case(case)
    )
    user_message = f"Question about the {case['name']} case: {request.question}"

    try:
        answer = await call_gemini(system_prompt, user_message)
    except HTTPException:
        raise
    except Exception as e:
feature/ai-endpoint-validation
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

        raise HTTPException(status_code=500, detail=f"AI error: {e!s}")
main

    return {
        "case_id": request.case_id,
        "case_name": case["name"],
        "mode": request.mode,
        "question": request.question,
        "answer": answer
    }


 feature/ai-endpoint-validation
@router.post("/build-theory", dependencies=[Depends(check_rate_limit)])

@router.post("/ask-stream")
async def ask_investigator_stream(request: InvestigatorRequest):
    """
    Feature 6: AI Investigator with Real-Time Streaming.
    Sends the user's question to Gemini with a mode-specific prompt and
    injects the full case file as context. Yields Server-Sent Events (SSE).
    """
    case = load_case(request.case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{request.case_id}' not found")

    mode = request.mode.lower()
    if mode not in MODE_SYSTEM_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown mode '{mode}'. Choose: detective, scientist, journalist, historian")

    # Build the full system prompt
    system_prompt = (
        MODE_SYSTEM_PROMPTS[mode]
        + "\n\n"
        + UNIVERSAL_RULES
        + "\n\n"
        + build_context_from_case(case)
    )

    user_message = f"Question about the {case['name']} case: {request.question}"

    async def stream_generator():
        if not GEMINI_API_KEY:
            # Yield a mock response chunk by chunk for testing
            mock_text = _mock_response(user_message)
            for word in mock_text.split(" "):
                yield f"data: {json.dumps({'text': word + ' '})}\n\n"
                await asyncio.sleep(0.05)
            yield "data: [DONE]\n\n"
            return

        try:
            model = genai.GenerativeModel(
                model_name=MODEL_NAME,
                system_instruction=system_prompt
            )
            response = model.generate_content(user_message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@router.post("/build-theory")
 main
async def build_theory(request: TheoryBuildRequest):
    case = get_case_or_404(request.case_id)

    system_prompt = f"""You are an evidence analyst evaluating a user-submitted theory about an unsolved case.
Your job is to fairly and rigorously test the theory against available evidence.
Be honest. Be neutral. If the theory lacks support, say so clearly.
If parts of the theory are plausible, acknowledge that.

NEVER claim certainty. NEVER say a theory is definitely true or definitely false.
Use these labels: Strongly Supported / Moderately Supported / Weakly Supported / Contradicted by Evidence / Not Enough Evidence to Judge

{UNIVERSAL_RULES}

{build_context_from_case(case)}

Format your response with these exact sections:
## Theory Being Evaluated
## Supporting Evidence
## Contradicting Evidence  
## Missing Evidence (what would need to be found to support or disprove this)
## Plausibility Assessment
## Overall Verdict (choose one: Plausible but Unproven / Unlikely Given Evidence / Cannot Be Assessed / Consistent with Evidence)"""

    user_message = f"Please evaluate this theory about the {case['name']} case: {request.user_theory}"

    try:
        answer = await call_gemini(system_prompt, user_message)
    except HTTPException:
        raise
    except Exception as e:
 feature/ai-endpoint-validation
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

        raise HTTPException(status_code=500, detail=f"AI error: {e!s}")
 main

    return {
        "case_id": request.case_id,
        "case_name": case["name"],
        "user_theory": request.user_theory,
        "evaluation": answer
    }


@router.post("/compare-theories", dependencies=[Depends(check_rate_limit)])
async def compare_theories(request: CompareTheoriesRequest):
    case = get_case_or_404(request.case_id)

    system_prompt = f"""You are a neutral evidence analyst comparing two competing theories about an unsolved case.
Present both theories fairly. Do not favor one unless the evidence clearly does.
Be specific: cite actual evidence from the case file for each claim.

{UNIVERSAL_RULES}

{build_context_from_case(case)}

Format your response with these exact sections:
## Theory A: [Name]
### Supporting Evidence
### Contradicting Evidence
### What This Theory Cannot Explain

## Theory B: [Name]
### Supporting Evidence
### Contradicting Evidence
### What This Theory Cannot Explain

## Missing Evidence (what both theories need)
## Overall Assessment (which theory is better supported by current evidence, and why)"""

    user_message = f"Compare these two theories about the {case['name']} case: Theory A = '{request.theory_a}', Theory B = '{request.theory_b}'"

    try:
        answer = await call_gemini(system_prompt, user_message)
    except HTTPException:
        raise
    except Exception as e:
 feature/ai-endpoint-validation
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

        raise HTTPException(status_code=500, detail=f"AI error: {e!s}")
 main

    return {
        "case_id": request.case_id,
        "case_name": case["name"],
        "theory_a": request.theory_a,
        "theory_b": request.theory_b,
        "comparison": answer
    }