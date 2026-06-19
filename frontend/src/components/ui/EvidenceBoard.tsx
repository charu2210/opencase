import type { Evidence, ReliabilityLevel, ImportanceLevel } from "@/types";

const RELIABILITY_COLORS: Record<ReliabilityLevel, string> = {
  High: "#2e7d32",
  Medium: "#e65100",
  Low: "#c0392b",
};

const IMPORTANCE_COLORS: Record<ImportanceLevel, string> = {
  Critical: "#c0392b",
  High: "#8b1a0e",
  Medium: "#5a4a2e",
  Low: "#6b6456",
};

export default function EvidenceBoard({ evidence }: { evidence: Evidence[] }) {
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", marginBottom: 28, lineHeight: 1.6 }}>
        Each evidence item is rated by <strong>reliability</strong> (how trustworthy the source is) and
        <strong> importance</strong> (how much it affects conclusions).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {evidence.map(e => (
          <EvidenceCard key={e.id} evidence={e} />
        ))}
      </div>
    </div>
  );
}

function EvidenceCard({ evidence: e }: { evidence: Evidence }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid var(--ruled)",
      padding: 24,
      boxShadow: "3px 3px 0 var(--ruled)",
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.1rem",
        fontWeight: 700,
        marginBottom: 12,
        lineHeight: 1.3,
      }}>
        {e.title}
      </div>

      <p style={{ fontSize: ".875rem", color: "var(--muted)", lineHeight: 1.65, marginBottom: 20 }}>
        {e.description}
      </p>

      <div style={{
        borderTop: "1px solid var(--ruled)",
        paddingTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ".78rem", color: "var(--muted)", fontFamily: "'Courier Prime', monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>
            Source
          </span>
          <span style={{ fontSize: ".85rem", color: "var(--ink)", fontWeight: 500 }}>{e.source}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ".78rem", color: "var(--muted)", fontFamily: "'Courier Prime', monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>
            Reliability
          </span>
          <Badge color={RELIABILITY_COLORS[e.reliability]}>{e.reliability}</Badge>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ".78rem", color: "var(--muted)", fontFamily: "'Courier Prime', monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>
            Importance
          </span>
          <Badge color={IMPORTANCE_COLORS[e.importance]}>{e.importance}</Badge>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontFamily: "'Courier Prime', monospace",
      fontSize: ".75rem",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${color}`,
      padding: "2px 10px",
    }}>
      {children}
    </span>
  );
}
