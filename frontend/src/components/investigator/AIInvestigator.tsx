"use client";

import { useState } from "react";
import type { Theory, InvestigationMode } from "@/types";
import { askInvestigator } from "@/lib/api";

const MODES: { id: InvestigationMode; label: string; icon: string; desc: string }[] = [
  { id: "detective",  label: "Detective",  icon: "🔍", desc: "Suspects, motives, opportunity" },
  { id: "scientist",  label: "Scientist",  icon: "🧪", desc: "Evidence quality, uncertainty" },
  { id: "journalist", label: "Journalist", icon: "📰", desc: "Neutral facts-only reporting" },
  { id: "historian",  label: "Historian",  icon: "📚", desc: "Historical context & parallels" },
];

interface Props {
  caseId: string;
  caseName: string;
  theories: Theory[];
}

export default function AIInvestigator({ caseId, caseName, theories }: Props) {
  const [mode, setMode] = useState<InvestigationMode>("detective");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUGGESTED_QUESTIONS = [
    `Why is ${caseName} still unsolved?`,
    "What is the most compelling piece of evidence?",
    "What do investigators still need to find?",
    theories[0] ? `What evidence supports the ${theories[0].name} theory?` : "Which theory has the most support?",
  ];

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await askInvestigator({ question, case_id: caseId, mode });
      setResponse(res.answer);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Explanation */}
      <div style={{
        background: "var(--manila)",
        border: "1px solid var(--ruled)",
        padding: "16px 20px",
        marginBottom: 28,
        fontSize: ".875rem",
        color: "var(--muted)",
        lineHeight: 1.65,
      }}>
        <strong style={{ color: "var(--ink)" }}>Prompt Engineering Demo:</strong> The same question produces different
        structured outputs depending on the investigation mode. Each mode uses a different system prompt that shapes
        how the AI frames its analysis.
      </div>

      {/* Mode Selector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 12,
        }}>Investigation Mode</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, border: "1px solid var(--ruled)" }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: "14px 12px",
                background: mode === m.id ? "var(--ink)" : "var(--paper)",
                color: mode === m.id ? "var(--paper)" : "var(--muted)",
                border: "none",
                borderRight: "1px solid var(--ruled)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>{m.icon}</div>
              <div style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: ".75rem",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}>{m.label}</div>
              <div style={{ fontSize: ".72rem", opacity: .7, lineHeight: 1.4 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Questions */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 10,
        }}>Suggested Questions</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestion(q)}
              style={{
                padding: "6px 14px",
                background: "var(--paper)",
                border: "1px solid var(--ruled)",
                fontSize: ".82rem",
                color: "var(--muted)",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAsk()}
          placeholder={`Ask as ${MODES.find(m => m.id === mode)?.label}…`}
          style={{
            flex: 1,
            padding: "14px 18px",
            fontFamily: "'Inter', sans-serif",
            fontSize: ".95rem",
            border: "1px solid var(--ink)",
            borderRight: "none",
            background: "var(--paper)",
            color: "var(--ink)",
            outline: "none",
          }}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            padding: "14px 28px",
            background: loading ? "var(--muted)" : "var(--ink)",
            color: "var(--paper)",
            border: "none",
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".85rem",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Analyzing…" : "Ask"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "16px 20px",
          background: "#fff0f0",
          border: "1px solid var(--red)",
          color: "var(--red)",
          fontSize: ".875rem",
          marginBottom: 20,
        }}>
          {error}. Make sure the backend is running and your GEMINI_API_KEY is set.
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          background: "var(--ink)",
          padding: "28px 32px",
          color: "var(--paper)",
        }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".85rem",
            letterSpacing: ".1em",
          }}>
            <span style={{ animation: "pulse 1s infinite", display: "inline-block" }}>●</span>
            <span>AI Investigator analyzing as {MODES.find(m => m.id === mode)?.label}…</span>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "28px 32px",
        }}>
          {/* Terminal-style header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 20, paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,.15)",
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28ca42" }} />
            </div>
            <span style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: ".75rem",
              letterSpacing: ".1em",
              color: "rgba(255,255,255,.5)",
              marginLeft: 8,
            }}>
              {MODES.find(m => m.id === mode)?.icon} Mode: {mode.toUpperCase()} · Case: {caseName}
            </span>
          </div>

          <div style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".9rem",
            lineHeight: 1.75,
            color: "var(--paper)",
            whiteSpace: "pre-wrap",
          }}>
            <MarkdownRenderer text={response} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Minimal markdown renderer for ## headings and bold text */
function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <div key={i} style={{
              color: "var(--redmid)",
              fontWeight: 700,
              fontSize: ".85rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginTop: 20,
              marginBottom: 8,
              paddingBottom: 4,
              borderBottom: "1px solid rgba(255,255,255,.1)",
            }}>
              {line.replace("## ", "")}
            </div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <div key={i} style={{ color: "#aaa", fontWeight: 700, marginTop: 12, marginBottom: 4, fontSize: ".82rem" }}>
              {line.replace("### ", "")}
            </div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} style={{ paddingLeft: 16, marginBottom: 4, color: "rgba(247,244,238,.85)" }}>
              › {line.replace(/^[-*] /, "")}
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        return (
          <div key={i} style={{ marginBottom: 4, color: "rgba(247,244,238,.9)" }}>{line}</div>
        );
      })}
    </div>
  );
}
