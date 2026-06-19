/**
 * API client — all calls to the FastAPI backend go through here.
 * Change API_BASE to point to your deployed backend URL in production.
 */

import type {
  CaseSummary,
  CaseDetail,
  InvestigatorRequest,
  InvestigatorResponse,
  TheoryBuildRequest,
  TheoryBuildResponse,
  TheoryCompareResponse,
  InvestigationModeInfo,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export const getCases = (): Promise<CaseSummary[]> =>
  fetchAPI("/api/cases/");

export const getCase = (id: string): Promise<CaseDetail> =>
  fetchAPI(`/api/cases/${id}`);

export const getCaseInterpretability = (id: string) =>
  fetchAPI(`/api/cases/${id}/interpretability`);

// ─── AI Investigator ──────────────────────────────────────────────────────────

export const askInvestigator = (body: InvestigatorRequest): Promise<InvestigatorResponse> =>
  fetchAPI("/api/investigator/ask", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const buildTheory = (body: TheoryBuildRequest): Promise<TheoryBuildResponse> =>
  fetchAPI("/api/investigator/build-theory", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const compareTheories = (
  case_id: string,
  theory_a: string,
  theory_b: string
): Promise<TheoryCompareResponse> =>
  fetchAPI(
    `/api/investigator/compare-theories?case_id=${encodeURIComponent(case_id)}&theory_a=${encodeURIComponent(theory_a)}&theory_b=${encodeURIComponent(theory_b)}`,
    { method: "POST" }
  );

// ─── Modes ────────────────────────────────────────────────────────────────────

export const getInvestigationModes = (): Promise<InvestigationModeInfo[]> =>
  fetchAPI("/api/theory/modes");
