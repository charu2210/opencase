# OpenCase

**AI-powered investigative intelligence platform.**  
Explore unsolved mysteries, analyze evidence, compare theories, and understand how AI reaches conclusions.

---

## What This Project Demonstrates

| Concept | How It's Demonstrated |
|---|---|
| **Prompt Engineering** | Four investigation modes (Detective, Scientist, Journalist, Historian) each use a different system prompt. The same question produces structurally different outputs per mode. |
| **Fine-Tuning (future-ready)** | The backend is structured so the Gemini API call can be swapped for a local fine-tuned model (Gemma/TinyLlama) with no other changes. The `/research` page explains LoRA and dataset construction. |
| **Interpretability** | The `/why-this-conclusion` page shows evidence importance rankings and step-by-step reasoning traces — making the AI's logic visible without advanced tooling. |

---

## Project Structure

```
opencase/
├── frontend/                  # Next.js + TypeScript
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Homepage — case gallery
│       │   ├── layout.tsx             # Nav + footer wrapper
│       │   ├── globals.css            # Design tokens matching landing page
│       │   ├── case/[slug]/page.tsx   # Case detail page (Feature 1)
│       │   ├── why-this-conclusion/   # Interpretability page (Feature 6)
│       │   └── research/              # Future research page (Feature 7)
│       ├── components/
│       │   ├── ui/
│       │   │   ├── EvidenceBoard.tsx  # Evidence cards with reliability ratings
│       │   │   └── TheoryList.tsx     # Theory cards with support levels
│       │   ├── investigator/
│       │   │   └── AIInvestigator.tsx # AI chat panel with mode switching (Features 2+3)
│       │   └── theory/
│       │       ├── TheoryComparator.tsx  # Side-by-side theory comparison (Feature 4)
│       │       └── BuildYourTheory.tsx   # User theory evaluation (Feature 5)
│       ├── lib/api.ts                 # All backend API calls
│       └── types/index.ts             # TypeScript types for everything
│
└── backend/                   # FastAPI (Python)
    ├── main.py                        # App entry point + CORS config
    ├── requirements.txt
    ├── .env.example
    ├── routers/
    │   ├── cases.py                   # Serves case data from JSON files
    │   ├── investigator.py            # AI Investigator + prompt templates (Features 2,3,4,5)
    │   └── theory.py                  # Investigation modes list
    └── data/
        ├── cases.json                 # Index of all cases
        └── mh370.json                 # Full MH370 case data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 1. Start the Backend

```bash
cd opencase/backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up your API key
cp .env.example .env
# Open .env and add your GEMINI_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
View interactive API docs at `http://localhost:8000/docs`.

---

### 2. Start the Frontend

```bash
cd opencase/frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port

# Run the dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cases/` | List all cases |
| GET | `/api/cases/{id}` | Full case detail (e.g. `/api/cases/mh370`) |
| GET | `/api/cases/{id}/interpretability` | Evidence importance + reasoning trace |
| POST | `/api/investigator/ask` | AI Investigator (with mode selection) |
| POST | `/api/investigator/build-theory` | Evaluate a user-submitted theory |
| POST | `/api/investigator/compare-theories` | Compare two theories |
| GET | `/api/theory/modes` | List investigation modes |

---

## Adding a New Case

1. Create `backend/data/your-case-id.json` following the structure of `mh370.json`
2. Add a summary entry to `backend/data/cases.json`
3. The frontend will automatically show the new case on the homepage and make it accessible at `/case/your-case-id`

No database, no migrations — just JSON files.

---

## How Prompt Engineering Works Here

The AI Investigator (Feature 3) demonstrates prompt engineering by using four different system prompts for the same question:

```
User question: "Why is MH370 still unsolved?"

Detective mode  → Focuses on suspects, motive, opportunity
Scientist mode  → Assesses evidence quality and uncertainty  
Journalist mode → Neutral reporting, attributed facts only
Historian mode  → Historical context and parallel cases
```

Each mode has a different system prompt in `backend/routers/investigator.py` under `MODE_SYSTEM_PROMPTS`. The case data (facts, evidence, theories) is injected as context into every prompt via `build_context_from_case()`.

---

## How Interpretability Works Here

The `/why-this-conclusion` page shows:

1. **Evidence Importance Rankings** — Each piece of evidence is rated Critical/High/Medium/Low with an explanation of why it matters more or less than other pieces.

2. **Reasoning Trace** — A step-by-step chain of observations and their implications, showing the logical path from raw facts to the final conclusion.

3. **Final Conclusion** — Stated with appropriate uncertainty — never claiming certainty where none exists.

This is simple, human-readable interpretability. It does not use TransformerLens, attention visualization, or SHAP. The `/research` page explains what those tools are and why they weren't used here.

---

## What's Coming Next (Future Research)

See `/research` in the running app, or `frontend/src/app/research/page.tsx` for the full breakdown.  
In short:

- **Fine-tuning Gemma 2B with LoRA** on a custom investigation dataset
- **Dedicated theory ranking classifier** (DistilBERT-based)
- **SHAP-based evidence attribution** for more rigorous interpretability
- **Larger case library** with expert-verified facts

---

## Design

OpenCase uses the same design tokens as the landing page:

```css
--ink:    #0f0e0c   /* Near-black for text */
--paper:  #f7f4ee   /* Off-white background */
--manila: #e8e0cc   /* Section backgrounds */
--red:    #c0392b   /* Primary accent */
--muted:  #6b6456   /* Secondary text */
--ruled:  #d4cdb8   /* Borders and dividers */

Fonts:
  Display: Playfair Display (serif)
  Body:    Inter (sans-serif)
  Mono:    Courier Prime (monospace — labels, codes, status)
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, CSS-in-JS (inline styles matching design system) |
| Backend | FastAPI, Python 3.10+ |
| AI | Google Gemini 1.5 Flash API |
| Data | Local JSON files (no database required) |
| Future AI | Gemma 2B / TinyLlama + LoRA fine-tuning via Hugging Face PEFT |

---

*Built as a student project demonstrating Prompt Engineering, Fine-Tuning concepts, and Interpretability.*
