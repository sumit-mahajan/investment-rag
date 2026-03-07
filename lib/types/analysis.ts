/**
 * Analysis workflow types
 * Used by agents, config, and API
 */

export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export type Verdict = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

/** Criteria definition (config) - what to analyze */
export interface CriteriaConfig {
  id: string;
  name: string;
  description: string;
  categories: string[];
  keyMetrics: string[];
  promptTemplate: string;
}

/** Result of analyzing one criterion */
export interface CriterionAnalysis {
  criterionId: string;
  criterionName: string;
  score: number;
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

/** Analysis workflow state (agent) */
export interface AnalysisWorkflow {
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

/** Result of analyzing one investment philosophy (value or growth) */
export interface PhilosophyAnalysis {
  philosophyId: string;
  philosophyName: string;
  verdict: Verdict;
  confidenceScore: number;
  metricsFound: string[];
  metricsNotFound: string[];
  findings: string;
  evidence: ChunkEvidence[];
}
