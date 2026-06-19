"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CaseDetail, InvestigationMode } from "@/types";
import { getCase } from "@/lib/api";
import EvidenceBoard from "@/components/ui/EvidenceBoard";
import TheoryList from "@/components/ui/TheoryList";
import AIInvestigator from "@/components/investigator/AIInvestigator";
import TheoryComparator from "@/components/theory/TheoryComparator";
import BuildYourTheory from "@/components/theory/BuildYourTheory";

type Tab = "overview" | "evidence" | "theories" | "investigator" | "build" | "compare";

export default function CasePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getCase(slug)
      .then(setCaseData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageState message="Loading case file…" />;
  if (error) return <PageState message={`Case not found: ${error}`} isError />;
  if (!caseData) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview",     label: "Overview" },
    { id: "evidence",     label: "Evidence Board" },
    { id: "theories",     label: "Theories" },
    { id: "investigator", label: "AI Investigator" },
    { id: "compare",      label: "Compare Theories" },
    { id: "build",        label: "Build Your Theory" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 32px" }}>
      {/* Case Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".75rem",
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 12,
        }}>
          {caseData.category} · Case File
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
              {caseData.full_name}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>
              {caseData.date} · {caseData.location}
            </p>
          </div>

          <StatusBadge status={caseData.status} />
        </div>

        <p style={{ marginTop: 20, fontSize: "1rem", color: "var(--muted)", maxWidth: 700, lineHeight: 1.7 }}>
          {caseData.summary}
        </p>

        {/* Quick stats */}
        <div style={{
          display: "flex", gap: 0, marginTop: 28,
          border: "1px solid var(--ruled)",
          background: "var(--manila)",
        }}>
          {[
            { label: "Known Facts", value: caseData.known_facts.length },
            { label: "Evidence Items", value: caseData.evidence.length },
            { label: "Theories", value: caseData.theories.length },
            { label: "Open Questions", value: caseData.unknowns.length },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1, padding: "16px 20px",
              borderRight: "1px solid var(--ruled)",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "var(--ink)",
              }}>{value}</div>
              <div style={{ fontSize: ".75rem", color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{
        display: "flex", gap: 0, borderBottom: "2px solid var(--ink)",
        marginBottom: 40, overflowX: "auto",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              fontFamily: "'Courier Prime', monospace",
              fontSize: ".8rem",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--red)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--red)" : "var(--muted)",
              cursor: "pointer",
              marginBottom: -2,
              whiteSpace: "nowrap",
              transition: "color .15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab caseData={caseData} />}
      {activeTab === "evidence" && <EvidenceBoard evidence={caseData.evidence} />}
      {activeTab === "theories" && <TheoryList theories={caseData.theories} />}
      {activeTab === "investigator" && <AIInvestigator caseId={caseData.id} caseName={caseData.name} theories={caseData.theories} />}
      {activeTab === "compare" && <TheoryComparator caseId={caseData.id} theories={caseData.theories} />}
      {activeTab === "build" && <BuildYourTheory caseId={caseData.id} caseName={caseData.name} />}
    </div>
  );
}

function OverviewTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
      {/* Known Facts */}
      <div>
        <SectionLabel>Known Facts</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {caseData.known_facts.map((fact, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "12px 16px",
              background: "var(--paper)", border: "1px solid var(--ruled)",
            }}>
              <span style={{ color: "#2e7d32", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: ".9rem", lineHeight: 1.6 }}>{fact}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unknowns */}
      <div>
        <SectionLabel>Open Questions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {caseData.unknowns.map((q, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "12px 16px",
              background: "var(--paper)", border: "1px solid var(--ruled)",
            }}>
              <span style={{ color: "var(--red)", fontWeight: 700, flexShrink: 0 }}>?</span>
              <span style={{ fontSize: ".9rem", lineHeight: 1.6, color: "var(--muted)" }}>{q}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Courier Prime', monospace",
      fontSize: ".75rem",
      letterSpacing: ".18em",
      textTransform: "uppercase",
      color: "var(--muted)",
      marginBottom: 16,
      paddingBottom: 8,
      borderBottom: "1px solid var(--ruled)",
    }}>{children}</div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isUnsolved = status === "Unsolved";
  return (
    <div style={{
      fontFamily: "'Courier Prime', monospace",
      fontSize: ".8rem",
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: isUnsolved ? "var(--red)" : "var(--muted)",
      border: `1px solid ${isUnsolved ? "var(--redmid)" : "var(--ruled)"}`,
      padding: "6px 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: isUnsolved ? "var(--red)" : "var(--muted)",
        display: "inline-block",
      }} />
      {status}
    </div>
  );
}

function PageState({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "80px 32px",
      color: isError ? "var(--red)" : "var(--muted)",
      fontFamily: "'Courier Prime', monospace",
      fontSize: "1rem",
    }}>
      {message}
    </div>
  );
}
