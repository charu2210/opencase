"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CaseSummary } from "@/types";
import { getCases } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  "Air Disaster": "#c0392b",
  "Crime": "#8b1a0e",
  "Historical": "#5a4a2e",
  "Science": "#2e4a5a",
};

export default function HomePage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "96px 32px 80px", textAlign: "center" }}>
        <span style={{
          display: "inline-block",
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".78rem",
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--red)",
          border: "1px solid var(--redmid)",
          padding: "4px 14px",
          marginBottom: 32,
        }}>
          AI-Powered Investigative Intelligence
        </span>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.8rem, 6vw, 5rem)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-.02em",
          marginBottom: 24,
        }}>
          Investigate the world's<br /><em style={{ fontStyle: "italic", color: "var(--red)" }}>greatest mysteries.</em>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 540, margin: "0 auto 40px" }}>
          Explore unsolved cases, weigh the evidence, compare theories, and ask the AI Investigator anything — facts only, no speculation.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/case/mh370">
            <button style={{
              background: "var(--red)", color: "#fff", border: "none",
              padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
            }}>
              Open MH370 Case File
            </button>
          </Link>
          <Link href="/why-this-conclusion">
            <button style={{
              background: "transparent", color: "var(--ink)",
              border: "1.5px solid var(--ink)", padding: "14px 32px",
              fontSize: "1rem", fontWeight: 500, cursor: "pointer",
            }}>
              How AI Reasons
            </button>
          </Link>
        </div>
      </section>

      {/* Scrolling strip */}
      <div style={{ background: "var(--ink)", padding: "14px 0", overflow: "hidden" }}>
        <div style={{
          display: "flex", gap: 48,
          animation: "scroll 28s linear infinite",
          whiteSpace: "nowrap",
        }}>
          {["MH370", "Zodiac Killer", "D.B. Cooper", "Dyatlov Pass", "Voynich Manuscript",
            "Roanoke Colony", "Wow Signal", "Black Dahlia", "Bermuda Triangle", "Air France 447",
            "MH370", "Zodiac Killer", "D.B. Cooper", "Dyatlov Pass", "Voynich Manuscript",
            "Roanoke Colony", "Wow Signal", "Black Dahlia", "Bermuda Triangle", "Air France 447",
          ].map((name, i) => (
            <span key={i} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: ".8rem",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--paper)",
              opacity: .65,
            }}>{name}</span>
          ))}
        </div>
        <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Cases Gallery */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "80px 32px" }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".75rem",
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 40,
          paddingBottom: 12,
          borderBottom: "1px solid var(--ruled)",
        }}>Browse Cases</div>

        {loading ? (
          <div style={{ color: "var(--muted)", fontFamily: "'Courier Prime', monospace" }}>
            Loading case files…
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 1,
            border: "1px solid var(--ruled)",
          }}>
            {cases.map((c) => (
              <Link key={c.id} href={`/case/${c.id}`} style={{ display: "block" }}>
                <div style={{
                  padding: 28,
                  borderRight: "1px solid var(--ruled)",
                  borderBottom: "1px solid var(--ruled)",
                  background: "var(--paper)",
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--manila)")}
                  onMouseOut={e => (e.currentTarget.style.background = "var(--paper)")}
                >
                  <div style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: ".72rem",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: CATEGORY_COLORS[c.category] || "var(--muted)",
                    marginBottom: 8,
                  }}>{c.category}</div>

                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}>{c.name}</div>

                  <div style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: 16 }}>
                    {c.date} · {c.location}
                  </div>

                  <p style={{ fontSize: ".875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                    {c.summary}
                  </p>

                  <div style={{ display: "flex", gap: 16, fontSize: ".8rem", color: "var(--muted)" }}>
                    <span>{c.facts_count} facts</span>
                    <span>{c.evidence_count} evidence</span>
                    <span>{c.theories_count} theories</span>
                  </div>

                  <div style={{
                    marginTop: 16,
                    display: "inline-block",
                    fontSize: ".78rem",
                    fontFamily: "'Courier Prime', monospace",
                    letterSpacing: ".06em",
                    color: c.status === "Unsolved" ? "var(--red)" : "var(--muted)",
                    border: `1px solid ${c.status === "Unsolved" ? "var(--redmid)" : "var(--ruled)"}`,
                    padding: "3px 10px",
                  }}>
                    {c.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features strip */}
      <div style={{ background: "var(--manila)", borderTop: "1px solid var(--ruled)", borderBottom: "1px solid var(--ruled)", padding: "72px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".75rem",
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 48,
            paddingBottom: 12,
            borderBottom: "1px solid var(--ruled)",
          }}>What's inside every case</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0 }}>
            {[
              { icon: "🗂️", title: "Case Dashboard", desc: "Status, known facts, and leading theories before you dive in." },
              { icon: "🔍", title: "Evidence Board", desc: "Each piece of evidence carries a credibility rating and an importance level." },
              { icon: "⚖️", title: "Theory Analysis", desc: "Every theory shows supporting evidence, contradictions, and support level." },
              { icon: "🤖", title: "AI Investigator", desc: "Ask anything. Get answers structured by facts and contradictions." },
              { icon: "🧪", title: "Build Your Theory", desc: "Submit your own theory and see how it holds up against the evidence." },
              { icon: "🧠", title: "Interpretability", desc: "See exactly why the AI reached its conclusion, step by step." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: 32,
                borderRight: "1px solid var(--ruled)",
                borderBottom: "1px solid var(--ruled)",
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: ".875rem", color: "var(--muted)", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
