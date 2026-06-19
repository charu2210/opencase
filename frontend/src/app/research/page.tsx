import Link from "next/link";

export default function ResearchPage() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "60px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--red)",
          marginBottom: 16,
        }}>
          Feature 7 · Future Research
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Research Directions
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: 640 }}>
          OpenCase's current version uses prompt engineering and structured JSON data to demonstrate AI
          reasoning. This page outlines what a more advanced version of OpenCase would use — covering
          Fine-Tuning, Interpretability, and custom dataset construction.
        </p>
      </div>

      {/* Research Areas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

        {/* 1. Fine-Tuning */}
        <ResearchCard
          number="01"
          title="Fine-Tuning with LoRA"
          status="Future Work"
          statusColor="var(--red)"
          summary="The current system uses the general-purpose Gemini API with carefully crafted prompts. A production version would fine-tune a smaller, open-source model specifically on investigation data."
          sections={[
            {
              heading: "Base Model",
              content: "Gemma 2B or TinyLlama 1.1B — small enough to run on a laptop GPU, large enough to understand complex reasoning tasks."
            },
            {
              heading: "LoRA (Low-Rank Adaptation)",
              content: "Instead of retraining all model weights (expensive), LoRA adds small trainable matrices alongside frozen base weights. This reduces GPU memory by ~60% and training time dramatically."
            },
            {
              heading: "Training Data",
              content: "A custom dataset of question-answer pairs about investigation cases, formatted as: {case_facts} + {question} → {structured_analysis}. Each answer would follow the structured format OpenCase already uses."
            },
            {
              heading: "Expected Improvement",
              content: "A fine-tuned model would consistently output the correct sections (Known Facts, Theories, Contradictions) without needing a lengthy system prompt, and would handle investigation-specific language more precisely."
            }
          ]}
          code={`# Example training data format (JSONL)
{"instruction": "Analyze this case...", 
 "context": "Known facts: ...", 
 "response": "## Known Facts\\n...\\n## Theories\\n..."}

# Fine-tuning with LoRA (pseudocode)
from peft import LoraConfig, get_peft_model
config = LoraConfig(r=8, lora_alpha=32, target_modules=["q_proj","v_proj"])
model = get_peft_model(base_model, config)
trainer = Trainer(model=model, dataset=investigation_dataset)
trainer.train()`}
        />

        {/* 2. Dataset Construction */}
        <ResearchCard
          number="02"
          title="Investigation Dataset Construction"
          status="Future Work"
          statusColor="var(--red)"
          summary="Building a high-quality dataset of structured investigation analyses is the prerequisite for fine-tuning. This section describes how that dataset would be constructed."
          sections={[
            {
              heading: "Sources",
              content: "Public records, official investigative reports (ATSB, FBI, NTSB), academic papers on unsolved cases, and curated Wikipedia articles with strict fact-checking."
            },
            {
              heading: "Format",
              content: "Each case would be stored as a structured JSON with verified facts, evidence provenance, and theory evaluations written by domain experts — not scraped automatically."
            },
            {
              heading: "Quality Control",
              content: "Claims are tagged as Confirmed, Disputed, or Speculative. Every fact needs at least one primary source citation. Speculative content is excluded from training data."
            },
            {
              heading: "Scale Target",
              content: "A useful first version would need approximately 500–1,000 well-curated case analyses. This is achievable for a research team over 6–12 months."
            }
          ]}
        />

        {/* 3. Theory Ranking Models */}
        <ResearchCard
          number="03"
          title="Theory Ranking with Classification"
          status="Future Work"
          statusColor="var(--red)"
          summary="Instead of relying on LLM output to rank theories, a dedicated classification model could score theory plausibility based on evidence features."
          sections={[
            {
              heading: "Approach",
              content: "Train a small text classifier (BERT or DistilBERT) on pairs of (theory, evidence) where the label is the expert plausibility rating. The classifier learns which evidence patterns correlate with stronger theories."
            },
            {
              heading: "Why Not Just Use LLM Scores?",
              content: "Large language models can hallucinate confidence scores or be inconsistent across sessions. A dedicated classifier trained on curated data is more reproducible and auditable."
            },
            {
              heading: "Limitations",
              content: "Classification models require labeled training data (expensive to create) and may not generalize well to novel case types outside their training distribution."
            }
          ]}
          code={`# Simplified theory ranking (pseudocode)
from transformers import pipeline

classifier = pipeline("text-classification", 
                       model="opencase/theory-ranker")

result = classifier({
    "text": f"Theory: {theory}\\nEvidence: {evidence}"
})
# Returns: {"label": "Strong Support", "score": 0.82}`}
        />

        {/* 4. Explainable AI */}
        <ResearchCard
          number="04"
          title="Explainable AI Methods"
          status="Future Work"
          statusColor="var(--red)"
          summary="OpenCase currently implements simple, human-readable interpretability. More rigorous XAI methods exist and would strengthen the platform."
          sections={[
            {
              heading: "SHAP (SHapley Additive Explanations)",
              content: "Would allow OpenCase to explain exactly how much each piece of evidence contributed to a theory's support score, expressed as a numeric attribution value."
            },
            {
              heading: "LIME (Local Interpretable Model-Agnostic Explanations)",
              content: "Creates a local linear approximation of the model's behavior around a specific input. Useful for explaining why one particular answer was generated."
            },
            {
              heading: "Attention Visualization",
              content: "For transformer models, attention weights can (with caveats) show which words in the input most influenced the output. This is controversial as a full explanation but is useful as a debugging tool."
            },
            {
              heading: "Why We Chose Simple Interpretability",
              content: "SHAP and LIME add significant complexity and can be misleading if misread. The current reasoning trace approach is more honest about what the system is actually doing — and more useful for end users."
            }
          ]}
        />

      </div>

      {/* Current implementation summary */}
      <div style={{
        marginTop: 56,
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "32px",
      }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.4)",
          marginBottom: 16,
        }}>What OpenCase Demonstrates Now</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {[
            { concept: "Prompt Engineering", impl: "Investigation modes (Detective/Scientist/Journalist/Historian) use different system prompts to produce structurally different outputs from the same question." },
            { concept: "Fine-Tuning Ready", impl: "The structured output format, JSON case data, and modular backend are designed to be replaced by a fine-tuned model with minimal changes." },
            { concept: "Interpretability", impl: "Evidence importance rankings and reasoning trace show users exactly why a conclusion was reached, without requiring advanced ML tooling." },
          ].map(({ concept, impl }) => (
            <div key={concept}>
              <div style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: ".75rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--redmid)",
                marginBottom: 8,
              }}>{concept}</div>
              <p style={{ fontSize: ".85rem", color: "rgba(247,244,238,.75)", lineHeight: 1.65 }}>{impl}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <Link href="/case/mh370" style={{
            display: "inline-block",
            padding: "10px 22px",
            background: "var(--red)",
            color: "#fff",
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".8rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}>
            See It in Action →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResearchCard({
  number, title, status, statusColor, summary, sections, code
}: {
  number: string;
  title: string;
  status: string;
  statusColor: string;
  summary: string;
  sections: { heading: string; content: string }[];
  code?: string;
}) {
  return (
    <div style={{ border: "1px solid var(--ruled)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid var(--ruled)",
        background: "var(--manila)",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".75rem",
            color: "var(--muted)",
            letterSpacing: ".1em",
          }}>{number}</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.2rem",
            fontWeight: 700,
          }}>{title}</h2>
        </div>
        <span style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: statusColor,
          border: `1px solid ${statusColor}`,
          padding: "3px 10px",
        }}>{status}</span>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px" }}>
        <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.7, marginBottom: 24 }}>
          {summary}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: code ? 24 : 0 }}>
          {sections.map(s => (
            <div key={s.heading}>
              <div style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: ".75rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                marginBottom: 6,
              }}>{s.heading}</div>
              <p style={{ fontSize: ".875rem", color: "var(--muted)", lineHeight: 1.65 }}>{s.content}</p>
            </div>
          ))}
        </div>

        {code && (
          <pre style={{
            background: "#1a1a1a",
            color: "#e8e8e8",
            padding: "20px 24px",
            fontSize: ".8rem",
            lineHeight: 1.7,
            overflow: "auto",
            fontFamily: "'Courier Prime', monospace",
            borderRadius: 0,
          }}>
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}
