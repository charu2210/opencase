import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OpenCase — Investigate the World's Greatest Mysteries",
  description: "AI-powered investigative intelligence platform. Explore unsolved mysteries, analyze evidence, compare theories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 48px",
          borderBottom: "1px solid var(--ruled)",
          background: "var(--paper)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <Link href="/" style={{
            fontFamily: "'Courier Prime', monospace",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink)",
          }}>
            OpenCase
          </Link>

          <div style={{ display: "flex", gap: "32px" }}>
            {[
              { href: "/", label: "Cases" },
              { href: "/why-this-conclusion", label: "Why This Conclusion" },
              { href: "/research", label: "Research" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: ".875rem",
                  color: "var(--muted)",
                  letterSpacing: ".04em",
                  transition: "color .15s",
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <Link href="/case/mh370">
            <button style={{
              background: "var(--red)",
              color: "#fff",
              border: "none",
              padding: "9px 22px",
              fontFamily: "'Inter', sans-serif",
              fontSize: ".875rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: ".04em",
            }}>
              Open a Case
            </button>
          </Link>
        </nav>

        <main>{children}</main>

        <footer style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "40px 48px",
          marginTop: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}>OpenCase</span>
          <p style={{ color: "var(--muted)", fontSize: ".875rem" }}>
            Built with prompt engineering, fine-tuning &amp; interpretability.
          </p>
          <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>
            © 2025 OpenCase — Student Project
          </p>
        </footer>
      </body>
    </html>
  );
}
