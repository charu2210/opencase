import type { Theory, SupportLevel } from "@/types";

const SUPPORT_CONFIG: Record<SupportLevel, { color: string; bar: number }> = {
  "Strong Support":   { color: "#2e7d32", bar: 80 },
  "Moderate Support": { color: "#e65100", bar: 50 },
  "Weak Support":     { color: "#c0392b", bar: 25 },
};

export default function TheoryList({ theories }: { theories: Theory[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.6 }}>
        Theories are rated by how well available evidence supports them. Note: support levels reflect current evidence only —
        not probability of guilt or truth. No percentages are shown because the data does not support that precision.
      </p>

      {theories.map((theory, i) => (
        <TheoryCard key={theory.id} theory={theory} rank={i + 1} />
      ))}
    </div>
  );
}

function TheoryCard({ theory, rank }: { theory: Theory; rank: number }) {
  const config = SUPPORT_CONFIG[theory.support_level];

  return (
    <div style={{
      border: "1px solid var(--ruled)",
      background: "var(--paper)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--ruled)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: ".75rem",
            color: "var(--muted)",
            letterSpacing: ".1em",
          }}>T{String(rank).padStart(2, "0")}</span>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.2rem",
            fontWeight: 700,
          }}>{theory.name}</h3>
        </div>

        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: ".75rem",
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: config.color,
          border: `1px solid ${config.color}`,
          padding: "4px 12px",
        }}>
          {theory.support_level}
        </div>
      </div>

      {/* Support bar */}
      <div style={{ padding: "8px 24px", background: "var(--manila)", borderBottom: "1px solid var(--ruled)" }}>
        <div style={{
          height: 4,
          background: "var(--ruled)",
          borderRadius: 2,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${config.bar}%`,
            background: config.color,
            transition: "width .6s ease",
          }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: ".9rem", color: "var(--muted)", lineHeight: 1.65, marginBottom: 24 }}>
          {theory.description}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <EvidenceList
            title="Supporting Evidence"
            items={theory.supporting_evidence}
            color="#2e7d32"
            marker="✓"
          />
          <EvidenceList
            title="Contradicting Evidence"
            items={theory.contradicting_evidence}
            color="var(--red)"
            marker="✗"
          />
        </div>
      </div>
    </div>
  );
}

function EvidenceList({
  title, items, color, marker
}: {
  title: string; items: string[]; color: string; marker: string;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: ".72rem",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: `1px solid ${color}`,
      }}>{title}</div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 10, fontSize: ".875rem", lineHeight: 1.5 }}>
            <span style={{ color, flexShrink: 0, fontWeight: 700 }}>{marker}</span>
            <span style={{ color: "var(--muted)" }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
