"use client";

import { useState } from "react";
import { buildTheory } from "@/lib/api";

interface Props {
  caseId: string;
  caseName: string;
}

const EXAMPLE_THEORIES = [
  "The aircraft secretly landed at a remote location and the passengers are still alive.",
  "A cargo fire caused the crew to divert but they became incapacitated before reaching an airport.",
  "The disappearance was staged to cover an insurance fraud operation.",
];

export default function BuildYourTheory({ caseId, caseName }: Props) {
  const [theory, setTheory] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!theory.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await buildTheory({ case_id: caseId, user_theory: theory });
      setResult(res.evaluation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{
        background: "var(--manila)",
        border: "1px solid var(--ruled)",
        padding: "16px 20px",
        marginBottom: 28,
        fontSize: ".875rem",
        color: "var(--muted)",
        lineHeight: 1.65,
      }}>
        <strong style={{ color: "var(--ink)" }}>Build Your Theory:</strong> Submit any theory about this case.
        The AI will evaluate it fairly against the evidence — identifying what supports it, what contradicts it,
        and what evidence is missing. The AI never claims certainty.
      </div>

      {/* Examples */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 10,
        }}>Example Theories — Click to Try</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXAMPLE_THEORIES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setTheory(ex)}
              style={{
                textAlign: "left",
                padding: "10px 16px",
                background: "var(--paper)",
                border: "1px solid var(--ruled)",
                fontSize: ".875rem",
                color: "var(--muted)",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5,
              }}
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      {/* Theory input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 8,
        }}>Your Theory About {caseName}</div>
        <textarea
          value={theory}
          onChange={e => setTheory(e.target.value)}
          placeholder={`Describe your theory about what happened to ${caseName}…`}
          rows={4}
          style={{
            width: "100%",
            padding: "14px 18px",
            fontFamily: "'Inter', sans-serif",
            fontSize: ".95rem",
            border: "1px solid var(--ruled)",
            background: "var(--paper)",
            color: "var(--ink)",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !theory.trim()}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "var(--muted)" : "var(--red)",
          color: "#fff",
          border: "none",
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".85rem",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          marginBottom: 28,
        }}
      >
        {loading ? "Evaluating Theory…" : "Evaluate My Theory →"}
      </button>

      {error && (
        <div style={{ padding: "16px 20px", background: "#fff0f0", border: "1px solid var(--red)", color: "var(--red)", fontSize: ".875rem", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <div style={{ border: "1px solid var(--ruled)" }}>
          <div style={{
            background: "var(--ink)", color: "var(--paper)",
            padding: "14px 20px",
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".8rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}>
            Theory Evaluation — {caseName}
          </div>
          <div style={{ padding: "28px 32px" }}>
            <div style={{
              padding: "14px 18px",
              background: "var(--manila)",
              border: "1px solid var(--ruled)",
              marginBottom: 24,
              fontSize: ".875rem",
              color: "var(--muted)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}>
              "{theory}"
            </div>
            <EvaluationRenderer text={result} />
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluationRenderer({ text }: { text: string }) {
  const sectionColors: Record<string, string> = {
    "Supporting Evidence": "#2e7d32",
    "Contradicting Evidence": "#c0392b",
    "Missing Evidence": "#e65100",
    "Plausibility Assessment": "#2e4a5a",
    "Overall Verdict": "var(--ink)",
  };

  const lines = text.split("\n");
  let currentSection = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          const title = line.replace("## ", "");
          currentSection = title;
          const color = sectionColors[title] || "var(--ink)";
          return (
            <div key={i} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: ".78rem",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color,
              marginTop: 24, marginBottom: 8,
              paddingBottom: 6,
              borderBottom: `1px solid ${color}`,
            }}>{title}</div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} style={{ paddingLeft: 16, color: "var(--muted)", fontSize: ".875rem", lineHeight: 1.6, marginBottom: 4 }}>
              · {line.replace(/^[-*] /, "")}
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <div key={i} style={{ fontSize: ".9rem", lineHeight: 1.7, color: "var(--ink)" }}>{line}</div>;
      })}
    </div>
  );
}
