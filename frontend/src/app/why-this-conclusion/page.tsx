"use client";

import { useEffect, useState } from "react";
import { getCaseInterpretability } from "@/lib/api";
import type { ImportanceLevel } from "@/types";
import Link from "next/link";

interface InterpretabilityData {
  case_id: string;
  case_name: string;
  most_important_evidence: Array<{
    item: string;
    importance: ImportanceLevel;
    reason: string;
  }>;
  reasoning_trace: Array<{
    step: number;
    observation: string;
    implication: string;
  }>;
  conclusion: string;
}

const IMPORTANCE_CONFIG: Record<ImportanceLevel, { color: string; width: string }> = {
  Critical: { color: "#c0392b", width: "100%" },
  High:     { color: "#8b1a0e", width: "75%" },
  Medium:   { color: "#e65100", width: "50%" },
  Low:      { color: "#6b6456", width: "25%" },
};

// For this demo we always show MH370 interpretability.
// In a full app, the user would select a case first.
const DEFAULT_CASE = "mh370";

export default function InterpretabilityPage() {
  const [data, setData] = useState<InterpretabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCaseInterpretability(DEFAULT_CASE)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "60px 32px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".72rem",
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--red)",
          marginBottom: 16,
        }}>
          Interpretability · Feature 6
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Why This Conclusion?
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: 640 }}>
          This page shows how OpenCase reaches its conclusions. Rather than just presenting an answer,
          we show which evidence mattered most, how it was weighted, and the reasoning steps that led to the conclusion.
          This is a simple, human-readable form of AI interpretability.
        </p>
      </div>

      {/* Explainer box */}
      <div style={{
        background: "var(--manila)",
        border: "1px solid var(--ruled)",
        padding: "20px 24px",
        marginBottom: 40,
        fontSize: ".875rem",
        lineHeight: 1.7,
      }}>
        <strong>What is Interpretability?</strong> In AI systems, interpretability means understanding
        <em> why</em> the system reached a particular output — not just <em>what</em> it said.
        OpenCase makes this visible by showing the evidence importance rankings and the step-by-step
        reasoning trace used to evaluate each case. This is distinct from black-box AI that simply
        outputs a conclusion with no explanation.
      </div>

      {loading && (
        <div style={{ color: "var(--muted)", fontFamily: "'Courier Prime', monospace" }}>
          Loading interpretability data…
        </div>
      )}

      {error && (
        <div style={{ color: "var(--red)", fontSize: ".9rem" }}>
          Could not load data: {error}. Make sure the backend is running.
        </div>
      )}

      {data && (
        <>
          <div style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".72rem",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 32,
            paddingBottom: 10,
            borderBottom: "1px solid var(--ruled)",
          }}>
            Case: {data.case_name}
            <Link href={`/case/${data.case_id}`} style={{
              marginLeft: 16, color: "var(--red)", textDecoration: "underline"
            }}>
              View Full Case →
            </Link>
          </div>

          {/* Evidence Importance */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 8,
            }}>Most Important Evidence</h2>
            <p style={{ color: "var(--muted)", fontSize: ".875rem", marginBottom: 24, lineHeight: 1.6 }}>
              Not all evidence is equal. These ratings reflect how much each piece actually contributes
              to the conclusion — based on reliability, specificity, and what it rules in or out.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.most_important_evidence.map((item, i) => {
                const config = IMPORTANCE_CONFIG[item.importance];
                return (
                  <div key={i} style={{
                    border: "1px solid var(--ruled)",
                    background: "var(--paper)",
                    padding: "20px 24px",
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 12,
                      flexWrap: "wrap",
                    }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1rem",
                        fontWeight: 700,
                      }}>{item.item}</span>
                      <span style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: ".75rem",
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: config.color,
                        border: `1px solid ${config.color}`,
                        padding: "2px 10px",
                        whiteSpace: "nowrap",
                      }}>
                        {item.importance}
                      </span>
                    </div>

                    {/* Visual importance bar */}
                    <div style={{
                      height: 4,
                      background: "var(--ruled)",
                      marginBottom: 12,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: config.width,
                        background: config.color,
                      }} />
                    </div>

                    <p style={{ fontSize: ".875rem", color: "var(--muted)", lineHeight: 1.6 }}>
                      {item.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Reasoning Trace */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 8,
            }}>Reasoning Trace</h2>
            <p style={{ color: "var(--muted)", fontSize: ".875rem", marginBottom: 28, lineHeight: 1.6 }}>
              Each step in the reasoning chain builds on the previous one. This is the logical path
              from raw observations to the final conclusion.
            </p>

            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                left: 20,
                top: 0,
                bottom: 0,
                width: 1,
                background: "var(--ruled)",
              }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {data.reasoning_trace.map((step, i) => (
                  <div key={step.step} style={{
                    display: "flex",
                    gap: 28,
                    paddingBottom: 32,
                    paddingLeft: 0,
                  }}>
                    {/* Step number bubble */}
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: "50%",
                      background: "var(--ink)",
                      color: "var(--paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: ".8rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                    }}>
                      {step.step}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1,
                      border: "1px solid var(--ruled)",
                      background: "var(--paper)",
                      padding: "16px 20px",
                      marginTop: 4,
                    }}>
                      <div style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: ".72rem",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}>Observation</div>
                      <p style={{ fontSize: ".9rem", lineHeight: 1.6, marginBottom: 14 }}>
                        {step.observation}
                      </p>

                      <div style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: ".72rem",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: "var(--red)",
                        marginBottom: 6,
                      }}>Implication</div>
                      <p style={{ fontSize: ".9rem", lineHeight: 1.6, color: "var(--muted)" }}>
                        {step.implication}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final Conclusion */}
          <section>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 20,
            }}>Conclusion</h2>

            <div style={{
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "28px 32px",
              lineHeight: 1.75,
              fontSize: ".95rem",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: 16, left: 20,
                fontFamily: "'Courier Prime', monospace",
                fontSize: ".7rem",
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.35)",
              }}>
                AI Conclusion — {data.case_name}
              </div>
              <div style={{ marginTop: 16 }}>{data.conclusion}</div>
            </div>

            <div style={{
              background: "var(--manila)",
              border: "1px solid var(--ruled)",
              padding: "16px 20px",
              marginTop: 16,
              fontSize: ".82rem",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}>
              <strong>Important:</strong> This conclusion is based on publicly available evidence and is not
              definitive. OpenCase never presents AI conclusions as established truth. Where evidence is ambiguous
              or missing, uncertainty is explicitly noted.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
