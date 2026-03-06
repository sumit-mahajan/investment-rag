export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export type Verdict = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

export interface AnalysisCriterion {
  id: string;
  name: string;
  description: string;
  categories: string[]; // Content categories for filtering (financial-performance, risk-factors, etc.)
  keyMetrics: string[];
  promptTemplate: string;
}

export interface CriterionAnalysis {
  criterionId: string;
  criterionName: string;
  score: number; // 0-1
  findings: string;
  evidence: ChunkEvidence[];
}

export interface ChunkEvidence {
  chunkId: string;
  content: string;
  categories: string[];
  pageNumber?: number;
  relevanceScore: number;
}

export interface Analysis {
  id: string;
  documentId: string;
  userId: string;
  status: AnalysisStatus;
  verdict?: Verdict;
  confidenceScore?: number;
  summary?: string;
  results?: CriterionAnalysis[];
  sources?: ChunkEvidence[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AnalysisRequest {
  documentId: string;
  criteriaIds: string[];
}

export interface AnalysisResponse {
  analysisId: string;
  status: AnalysisStatus;
  message?: string;
}
