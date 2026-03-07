/**
 * RAGAS Evaluation types
 */

// ============================================================================
// Core Evaluation Types
// ============================================================================

export interface EvaluationInput {
  question: string;
  answer: string;
  contexts: string[];
  ground_truth?: string;
}

export interface RAGASMetrics {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
  answer_semantic_similarity: number;
  answer_correctness: number;
}

export interface FaithfulnessDetails {
  total_statements: number;
  supported_statements: number;
  statements: string[];
  verdicts: boolean[];
  reasoning: string[];
}

export interface RelevancyDetails {
  reasoning: string;
}

export interface PrecisionDetails {
  relevance_scores: number[];
  reasoning: string[];
  average_relevance: number;
}

export interface RecallDetails {
  total_statements: number;
  attributed_statements: number;
  reasoning: string[];
}

export interface SimilarityDetails {
  reasoning: string;
}

export interface CorrectnessDetails {
  correctness_score: number;
  semantic_similarity: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  reasoning: string;
}

/** Fallback shape when metric cannot be computed (e.g. missing ground truth) */
export interface EvaluationDetailFallback {
  message?: string;
  error?: string;
}

/** Type guards for evaluation details */
export function isFaithfulnessDetails(
  x: FaithfulnessDetails | EvaluationDetailFallback | undefined
): x is FaithfulnessDetails {
  return x != null && "total_statements" in x;
}
export function isPrecisionDetails(
  x: PrecisionDetails | EvaluationDetailFallback | undefined
): x is PrecisionDetails {
  return x != null && "average_relevance" in x;
}
export function isCorrectnessDetails(
  x: CorrectnessDetails | EvaluationDetailFallback | undefined
): x is CorrectnessDetails {
  return x != null && "tp" in x;
}

export interface DetailedEvaluation extends RAGASMetrics {
  evaluation_details: {
    faithfulness_details?: FaithfulnessDetails | EvaluationDetailFallback;
    relevancy_details?: RelevancyDetails | EvaluationDetailFallback;
    precision_details?: PrecisionDetails | EvaluationDetailFallback;
    recall_details?: RecallDetails | EvaluationDetailFallback;
    similarity_details?: SimilarityDetails | EvaluationDetailFallback;
    correctness_details?: CorrectnessDetails | EvaluationDetailFallback;
  };
  timestamp: string;
  model_used: string;
}

// ============================================================================
// Batch Evaluation Types
// ============================================================================

export interface BatchOptions {
  parallel?: boolean;
  batchSize?: number;
}

export interface BatchEvaluationResult {
  individual_results: DetailedEvaluation[];
  aggregate_metrics: AggregateMetrics;
  summary: string;
}

export interface AggregateMetrics extends RAGASMetrics {
  std_dev: Partial<RAGASMetrics>;
}

// ============================================================================
// Quality Threshold Types
// ============================================================================

export interface QualityThresholds {
  faithfulness?: number;
  answer_relevancy?: number;
  context_precision?: number;
  context_recall?: number;
  answer_semantic_similarity?: number;
  answer_correctness?: number;
}

export interface QualityCheckResult {
  passes: boolean;
  failing_metrics: string[];
}

// ============================================================================
// Individual Metric Result Types
// ============================================================================

export interface MetricResult<T = unknown> {
  score: number;
  details: T | { error: string };
}

// ============================================================================
// Evaluation Strategy Types
// ============================================================================

export type EvaluationStrategy =
  | "comprehensive"
  | "generation-only"
  | "retrieval-only"
  | "quick";

export interface EvaluatorConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  timeout?: number;
}

// ============================================================================
// Test Case Types
// ============================================================================

export interface TestCase extends EvaluationInput {
  id?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface TestSuite {
  name: string;
  description?: string;
  test_cases: TestCase[];
  created_at: string;
}

// ============================================================================
// Monitoring Types
// ============================================================================

export interface EvaluationLog {
  id: string;
  timestamp: string;
  input: EvaluationInput;
  results: DetailedEvaluation;
  session_id?: string;
  environment?: string;
}

export interface MetricTrend {
  metric: keyof RAGASMetrics;
  data_points: Array<{ timestamp: string; value: number }>;
  summary: {
    mean: number;
    median: number;
    std_dev: number;
    min: number;
    max: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class EvaluationError extends Error {
  constructor(
    message: string,
    public code: EvaluationErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

export enum EvaluationErrorCode {
  INVALID_INPUT = "INVALID_INPUT",
  API_ERROR = "API_ERROR",
  TIMEOUT = "TIMEOUT",
  RATE_LIMIT = "RATE_LIMIT",
  PARSING_ERROR = "PARSING_ERROR",
  MISSING_GROUND_TRUTH = "MISSING_GROUND_TRUTH",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type MetricName = keyof RAGASMetrics;
export type MetricValue = number;
export type MetricScores = Record<MetricName, MetricValue>;
