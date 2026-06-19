// ─── Core Case Types ─────────────────────────────────────────────────────────

export type SupportLevel = "Strong Support" | "Moderate Support" | "Weak Support";
export type ReliabilityLevel = "High" | "Medium" | "Low";
export type ImportanceLevel = "Critical" | "High" | "Medium" | "Low";
export type CaseStatus = "Unsolved" | "Partially Resolved" | "Resolved" | "Unexplained";
export type InvestigationMode = "detective" | "scientist" | "journalist" | "historian";

export interface Evidence {
  id: string;
  title: string;
  description: string;
  source: string;
  reliability: ReliabilityLevel;
  importance: ImportanceLevel;
}

export interface Theory {
  id: string;
  name: string;
  description: string;
  support_level: SupportLevel;
  supporting_evidence: string[];
  contradicting_evidence: string[];
}

export interface InterpretabilityItem {
  item: string;
  importance: ImportanceLevel;
  reason: string;
}

export interface ReasoningStep {
  step: number;
  observation: string;
  implication: string;
}

export interface Interpretability {
  most_important_evidence: InterpretabilityItem[];
  reasoning_trace: ReasoningStep[];
  conclusion: string;
}

export interface CaseDetail {
  id: string;
  name: string;
  full_name: string;
  status: CaseStatus;
  category: string;
  date: string;
  location: string;
  summary: string;
  known_facts: string[];
  unknowns: string[];
  evidence: Evidence[];
  theories: Theory[];
  interpretability: Interpretability;
}

export interface CaseSummary {
  id: string;
  name: string;
  full_name: string;
  status: CaseStatus;
  category: string;
  date: string;
  location: string;
  summary: string;
  top_theory: string;
  top_theory_support: SupportLevel;
  facts_count: number;
  evidence_count: number;
  theories_count: number;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface InvestigatorRequest {
  question: string;
  case_id: string;
  mode: InvestigationMode;
}

export interface InvestigatorResponse {
  case_id: string;
  case_name: string;
  mode: InvestigationMode;
  question: string;
  answer: string;
}

export interface TheoryBuildRequest {
  case_id: string;
  user_theory: string;
}

export interface TheoryBuildResponse {
  case_id: string;
  case_name: string;
  user_theory: string;
  evaluation: string;
}

export interface TheoryCompareResponse {
  case_id: string;
  case_name: string;
  theory_a: string;
  theory_b: string;
  comparison: string;
}

export interface InvestigationModeInfo {
  id: InvestigationMode;
  label: string;
  description: string;
  icon: string;
}
