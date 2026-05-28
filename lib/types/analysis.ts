/**
 * Analysis domain types — 4-node LangGraph pipeline (FEATURES.md)
 */

export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export type InvestmentRecommendation =
  | "strong_buy"
  | "buy"
  | "hold"
  | "caution"
  | "avoid";

export interface Citation {
  documentName: string;
  pageNumber: number;
  fileId?: string;
  blobUrl?: string;
}

/** Overall investment view — score is 0–100 (higher = more attractive to invest) */
export interface InvestmentVerdict {
  score: number;
  recommendation: InvestmentRecommendation;
  headline: string;
  summary: string;
}

export interface Metric {
  label: string;
  value: string | null;
  citation: Citation | null;
}

export interface CaseSection {
  points: string[];
  citations: Citation[];
}

/** Documents/pages actually retrieved during analysis */
export interface SourceDocument {
  fileId: string;
  fileName: string;
  blobUrl: string;
  pages: number[];
  usedInSections: string[];
}

export interface InvestmentAnalysis {
  verdict: InvestmentVerdict;
  bullCase: CaseSection;
  bearCase: CaseSection;
  keyMetrics: Metric[];
  keyRisks: CaseSection;
  sourcesUsed?: SourceDocument[];
}

export interface ExtractedMetric {
  label: string;
  value: string | null;
  chunks: import("./core").RetrievedChunk[];
}
