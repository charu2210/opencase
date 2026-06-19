"use client";

import { useState } from "react";
import type { Theory } from "@/types";
import { compareTheories } from "@/lib/api";

interface Props {
  caseId: string;
  theories: Theory[];
}

export default function TheoryComparator({ caseId, theories }: Props) {
  const [theoryA, setTheoryA] = useState(theories[0]?.name || "");
  const [theoryB, setTheoryB] = useState(theories[1]?.name || "");
  const [useCustomA, setUseCustomA] = useState(false);
  const [useCustomB, setUseCustomB] = useState(false);
  const [customA, setCustomA] = useState("");
  const [customB, setCustomB] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedA = useCustomA ? customA : theoryA;
  const selectedB = useCustomB ? customB : theoryB;

  async function handleCompare() {
    if (!selectedA.trim() || !selectedB.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await compareTheories(caseId, selectedA, selectedB);
      setResult(res.comparison);
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
        Select two theories to compare them against the evidence side by side.
        The AI will evaluate each theory fairly, citing specific evidence from the case file.
      </div>

      {/* Theory selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start", marginBottom: 24 }}>
        <TheorySelector
          label="Theory A"
          theories={theories}
          value={theoryA}
          onSelect={setTheoryA}
          useCustom={useCustomA}
          onToggleCustom={() => setUseCustomA(v => !v)}
          customValue={customA}
          onCustomChange={setCustomA}
        />

        <div style={{
          paddingTop: 32,
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.4rem",
          color: "var(--muted)",
          textAlign: "center",
        }}>VS</div>

        <TheorySelector
          label="Theory B"
          theories={theories}
          value={theoryB}
          onSelect={setTheoryB}
          useCustom={useCustomB}
          onToggleCustom={() => setUseCustomB(v => !v)}
          customValue={customB}
          onCustomChange={setCustomB}
        />
      </div>

      <button
        onClick={handleCompare}
        disabled={loading || !selectedA.trim() || !selectedB.trim()}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "var(--muted)" : "var(--ink)",
          color: "var(--paper)",
          border: "none",
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".85rem",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          marginBottom: 28,
        }}
      >
        {loading ? "Comparing…" : `Compare: ${selectedA || "Theory A"} vs ${selectedB || "Theory B"}`}
      </button>

      {error && (
        <div style={{ padding: "16px 20px", background: "#fff0f0", border: "1px solid var(--red)", color: "var(--red)", fontSize: ".875rem", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ border: "1px solid var(--ruled)" }}>
          <div style={{
            background: "var(--ink)", color: "var(--paper)",
            padding: "14px 20px",
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".8rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}>
            Comparison: {selectedA} vs {selectedB}
          </div>
          <div style={{ padding: "28px 32px", background: "var(--paper)" }}>
            <ComparisonRenderer text={result} />
          </div>
        </div>
      )}
    </div>
  );
}

function TheorySelector({
  label, theories, value, onSelect, useCustom, onToggleCustom, customValue, onCustomChange
}: {
  label: string;
  theories: Theory[];
  value: string;
  onSelect: (v: string) => void;
  useCustom: boolean;
  onToggleCustom: () => void;
  customValue: string;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: ".72rem",
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: 8,
      }}>{label}</div>

      {!useCustom ? (
        <select
          value={value}
          onChange={e => onSelect(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontFamily: "'Inter', sans-serif",
            fontSize: ".9rem",
            border: "1px solid var(--ruled)",
            background: "var(--paper)",
            color: "var(--ink)",
            outline: "none",
            marginBottom: 8,
          }}
        >
          {theories.map(t => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      ) : (
        <input
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder="Enter a custom theory…"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontFamily: "'Inter', sans-serif",
            fontSize: ".9rem",
            border: "1px solid var(--ruled)",
            background: "var(--paper)",
            color: "var(--ink)",
            outline: "none",
            marginBottom: 8,
          }}
        />
      )}

      <button
        onClick={onToggleCustom}
        style={{
          fontSize: ".78rem",
          color: "var(--muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Courier Prime', monospace",
          letterSpacing: ".06em",
          textDecoration: "underline",
        }}
      >
        {useCustom ? "← Choose from list" : "Enter custom theory →"}
      </button>
    </div>
  );
}

function ComparisonRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <div key={i} style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              marginTop: 24,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: "1px solid var(--ruled)",
            }}>{line.replace("## ", "")}</div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <div key={i} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: ".8rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginTop: 16, marginBottom: 6,
            }}>{line.replace("### ", "")}</div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} style={{ paddingLeft: 16, color: "var(--muted)", fontSize: ".875rem", lineHeight: 1.6 }}>
              · {line.replace(/^[-*] /, "")}
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <div key={i} style={{ fontSize: ".9rem", lineHeight: 1.65, color: "var(--ink)" }}>{line}</div>;
      })}
    </div>
  );
}
