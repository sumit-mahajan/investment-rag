/**
 * RAGAS Evaluator - Main Export Index
 * 
 * Import everything you need from this single file:
 * 
 * @example
 * import {
 *   evaluateRAGAS,
 *   evaluateBatch,
 *   meetsQualityThresholds,
 *   type EvaluationInput,
 *   type DetailedEvaluation
 * } from '@/lib/evaluation';
 */

// Main evaluation functions
export {
  evaluateRAGAS,
  evaluateBatch,
  evaluateFaithfulness,
  evaluateAnswerRelevancy,
  evaluateContextPrecision,
  evaluateContextRecall,
  evaluateSemanticSimilarity,
  evaluateCorrectness,
  formatEvaluationResults,
  meetsQualityThresholds,
} from './ragas-evaluator';

// Types
export type {
  EvaluationInput,
  RAGASMetrics,
  DetailedEvaluation,
  BatchOptions,
  BatchEvaluationResult,
  AggregateMetrics,
  QualityThresholds,
  QualityCheckResult,
  MetricResult,
  FaithfulnessDetails,
  RelevancyDetails,
  PrecisionDetails,
  RecallDetails,
  SimilarityDetails,
  CorrectnessDetails,
  EvaluationStrategy,
  EvaluatorConfig,
  TestCase,
  TestSuite,
  EvaluationLog,
  MetricTrend,
  EvaluationError,
  EvaluationErrorCode,
  MetricName,
  MetricValue,
  MetricScores,
} from '../../types/evaluation';

// Re-export for convenience
export { evaluateRAG } from './rag-metrics'; // Legacy evaluator
