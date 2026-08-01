"""
AI Investigator router.

This is the core of OpenCase's prompt engineering demonstration.
Each investigation mode uses a carefully crafted prompt that shapes
how the AI frames its analysis.
"""

import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from mcp.cache_tools import generate_cache_key, get_cached_response, set_cached_response

router = APIRouter()

# ─── Gemini setup ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-1.5-flash"


# ─── Request/Response models ──────────────────────────────────────────────────
class InvestigatorRequest(BaseModel):
    question: str
    case_id: str
    mode: str = "detective"   # detective | scientist | journalist | historian


class TheoryBuildRequest(BaseModel):
    case_id: str
    user_theory: str


# ─── INVESTIGATION MODE PROMPT TEMPLATES ─────────────────────────────────────
# This section demonstrates Feature 3: Investigation Modes (Prompt Engineering)
# The same question produces structurally different responses based on mode.

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

# Shared rules appended to every prompt regardless of mode
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


def build_context_from_case(case: dict) -> str:
    """Build a structured case summary to inject into every prompt."""
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


async def call_gemini(system_prompt: str, user_message: str) -> str:
    """Call Gemini with a system prompt and user message. Returns the text response."""
    if not GEMINI_API_KEY:
        # Return a mock response when no API key is set (for development)
        return _mock_response(user_message)

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt
    )
    response = model.generate_content(user_message)
    return response.text


def _mock_response(question: str) -> str:
    """Fallback mock when no Gemini API key is configured."""
    return f"""## Mock Response (No API Key)

This is a placeholder response for: "{question}"

To enable real AI responses, add your GEMINI_API_KEY to the backend .env file.
Get a free key at: https://aistudio.google.com/app/apikey

The actual AI Investigator will respond with structured sections tailored to
the selected investigation mode (Detective, Scientist, Journalist, or Historian).
"""


# ─── ENDPOINTS ───────────────────────────────────────────────────────────────

@router.post("/ask")
async def ask_investigator(request: InvestigatorRequest):
    """
    Feature 2 + Feature 3: AI Investigator with Investigation Modes.
    Sends the user's question to Gemini with a mode-specific prompt and
    injects the full case file as context.
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

    # Cache check
    cache_key = generate_cache_key(request.case_id, mode, request.question)
    cached_answer = get_cached_response(cache_key)
    if cached_answer:
        return {
            "case_id": request.case_id,
            "case_name": case["name"],
            "mode": mode,
            "question": request.question,
            "answer": cached_answer,
            "cached": True
        }

    try:
        answer = await call_gemini(system_prompt, user_message)
        set_cached_response(cache_key, answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    return {
        "case_id": request.case_id,
        "case_name": case["name"],
        "mode": mode,
        "question": request.question,
        "answer": answer,
        "cached": False
    }


@router.post("/build-theory")
async def build_theory(request: TheoryBuildRequest):
    """
    Feature 5: Build Your Theory.
    User submits a custom theory; Gemini evaluates it against the case evidence.
    """
    case = load_case(request.case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{request.case_id}' not found")

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    return {
        "case_id": request.case_id,
        "case_name": case["name"],
        "user_theory": request.user_theory,
        "evaluation": answer
    }


@router.post("/compare-theories")
async def compare_theories(case_id: str, theory_a: str, theory_b: str):
    """
    Feature 4: Theory Comparator.
    Compares two named theories against the case evidence.
    """
    case = load_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

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

    user_message = f"Compare these two theories about the {case['name']} case: Theory A = '{theory_a}', Theory B = '{theory_b}'"

    try:
        answer = await call_gemini(system_prompt, user_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    return {
        "case_id": case_id,
        "case_name": case["name"],
        "theory_a": theory_a,
        "theory_b": theory_b,
        "comparison": answer
    }
