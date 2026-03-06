/**
 * Type definitions for RAGAS Evaluator
 */

// ============================================================================
// Core Evaluation Types
// ============================================================================

export interface EvaluationInput {
  /** The user's question */
  question: string;
  /** The generated answer from the RAG system */
  answer: string;
  /** Retrieved context chunks (ordered by relevance) */
  contexts: string[];
  /** Optional ground truth answer for reference-based metrics */
  ground_truth?: string;
}

export interface RAGASMetrics {
  /** Faithfulness score (0-1): Are all claims supported by context? */
  faithfulness: number;
  /** Answer relevancy score (0-1): How well does answer address question? */
  answer_relevancy: number;
  /** Context precision score (0-1): How relevant is retrieved context? */
  context_precision: number;
  /** Context recall score (0-1): Does context contain all necessary info? */
  context_recall: number;
  /** Answer semantic similarity (0-1): Semantic equivalence to ground truth */
  answer_semantic_similarity: number;
  /** Answer correctness (0-1): Combined factual and semantic correctness */
  answer_correctness: number;
}

export interface DetailedEvaluation extends RAGASMetrics {
  /** Detailed breakdown of each metric evaluation */
  evaluation_details: {
    faithfulness_details?: FaithfulnessDetails;
    relevancy_details?: RelevancyDetails;
    precision_details?: PrecisionDetails;
    recall_details?: RecallDetails;
    similarity_details?: SimilarityDetails;
    correctness_details?: CorrectnessDetails;
  };
  /** ISO timestamp of evaluation */
  timestamp: string;
  /** Model used for evaluation */
  model_used: string;
}

// ============================================================================
// Metric Detail Types
// ============================================================================

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
  tp: number;  // True positives
  fp: number;  // False positives
  fn: number;  // False negatives
  precision: number;
  recall: number;
  reasoning: string;
}

// ============================================================================
// Batch Evaluation Types
// ============================================================================

export interface BatchOptions {
  /** Process evaluations in parallel (default: false) */
  parallel?: boolean;
  /** Number of evaluations to process in each batch (default: 5) */
  batchSize?: number;
}

export interface BatchEvaluationResult {
  /** Individual evaluation results for each test case */
  individual_results: DetailedEvaluation[];
  /** Aggregated metrics across all test cases */
  aggregate_metrics: AggregateMetrics;
  /** Human-readable summary of results */
  summary: string;
}

export interface AggregateMetrics extends RAGASMetrics {
  /** Standard deviation for each metric */
  std_dev: Partial<RAGASMetrics>;
}

// ============================================================================
// Quality Threshold Types
// ============================================================================

export interface QualityThresholds {
  /** Minimum faithfulness score (default: 0.8) */
  faithfulness?: number;
  /** Minimum answer relevancy score (default: 0.7) */
  answer_relevancy?: number;
  /** Minimum context precision score (default: 0.7) */
  context_precision?: number;
  /** Minimum context recall score */
  context_recall?: number;
  /** Minimum semantic similarity score */
  answer_semantic_similarity?: number;
  /** Minimum answer correctness score */
  answer_correctness?: number;
}

export interface QualityCheckResult {
  /** Whether all thresholds are met */
  passes: boolean;
  /** List of metrics that failed to meet thresholds */
  failing_metrics: string[];
}

// ============================================================================
// Individual Metric Result Types
// ============================================================================

export interface MetricResult<T = any> {
  /** Score from 0 to 1 */
  score: number;
  /** Detailed breakdown of the metric evaluation */
  details: T | { error: string };
}

// ============================================================================
// Evaluation Strategy Types
// ============================================================================

export type EvaluationStrategy = 
  | 'comprehensive'  // All metrics (requires ground truth)
  | 'generation-only'  // Faithfulness + Relevancy only
  | 'retrieval-only'  // Precision + Recall only
  | 'quick';  // Essential metrics only

// ============================================================================
// Configuration Types
// ============================================================================

export interface EvaluatorConfig {
  /** Gemini API key (defaults to GOOGLE_GENAI_API_KEY env var) */
  apiKey?: string;
  /** Model name (default: gemini-2.0-flash-exp) */
  model?: string;
  /** Temperature for LLM calls (default: 0) */
  temperature?: number;
  /** Maximum retries for failed API calls (default: 3) */
  maxRetries?: number;
  /** Timeout for API calls in ms (default: 30000) */
  timeout?: number;
}

// ============================================================================
// Test Case Types
// ============================================================================

export interface TestCase extends EvaluationInput {
  /** Unique identifier for the test case */
  id?: string;
  /** Category or tag for organizing test cases */
  category?: string;
  /** Any additional metadata */
  metadata?: Record<string, any>;
}

export interface TestSuite {
  /** Name of the test suite */
  name: string;
  /** Description of what's being tested */
  description?: string;
  /** Test cases in this suite */
  test_cases: TestCase[];
  /** Creation timestamp */
  created_at: string;
}

// ============================================================================
// Monitoring Types
// ============================================================================

export interface EvaluationLog {
  /** Unique log ID */
  id: string;
  /** Timestamp of evaluation */
  timestamp: string;
  /** Evaluation input */
  input: EvaluationInput;
  /** Evaluation results */
  results: DetailedEvaluation;
  /** Optional session or request ID for correlation */
  session_id?: string;
  /** Environment (dev, staging, prod) */
  environment?: string;
}

export interface MetricTrend {
  /** Metric name */
  metric: keyof RAGASMetrics;
  /** Time series data points */
  data_points: Array<{
    timestamp: string;
    value: number;
  }>;
  /** Statistical summary */
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
    public details?: any
  ) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export enum EvaluationErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  PARSING_ERROR = 'PARSING_ERROR',
  MISSING_GROUND_TRUTH = 'MISSING_GROUND_TRUTH',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ============================================================================
// Utility Types
// ============================================================================

/** Make all properties of T optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extract metric names as a union type */
export type MetricName = keyof RAGASMetrics;

/** Metric value type */
export type MetricValue = number;

/** Metric scores as a map */
export type MetricScores = Record<MetricName, MetricValue>;
