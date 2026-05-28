/**
 * Central type exports
 */

export type {
  FileRecord,
  Chunk,
  ChunkType,
  ChunkMetadata,
  RetrievedChunk,
} from "./core";

export type { Analysis, Conversation, DocumentListItem } from "./domain-models";

export type { CreateAnalysisDTO, AnalysisFiltersDTO } from "./dtos";

export type { EmbeddingConfig } from "./rag";

export type {
  AnalysisStatus,
  InvestmentAnalysis,
  InvestmentVerdict,
  InvestmentRecommendation,
  Citation,
  Metric,
  CaseSection,
  SourceDocument,
  ExtractedMetric,
} from "./analysis";

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
  DeepPartial,
  MetricName,
  MetricValue,
  MetricScores,
} from "./evaluation";

export {
  EvaluationError,
  EvaluationErrorCode,
  isFaithfulnessDetails,
  isPrecisionDetails,
  isCorrectnessDetails,
} from "./evaluation";

export type { AnalysisDocumentRef, ConversationMessage } from "@/lib/db/schema";
