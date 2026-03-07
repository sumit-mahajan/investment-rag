/**
 * Central type exports
 * Import from @/lib/types for all application types
 */

// Domain models (entities)
export type {
  Document,
  DocumentChunk,
  Analysis,
  AnalysisCriterion,
  User,
  DocumentWithChunks,
  AnalysisWithDetails,
  DocumentListItem,
} from "./domain-models";

// Data transfer objects
export type {
  CreateDocumentDTO,
  UpdateDocumentStatusDTO,
  UpdateDocumentProcessingResultDTO,
  DocumentFiltersDTO,
  CreateDocumentChunkDTO,
  CreateAnalysisDTO,
  UpdateAnalysisStatusDTO,
  UpdateAnalysisResultsDTO,
  AnalysisFiltersDTO,
  CreateAnalysisCriterionDTO,
  CreateUserDTO,
  UpsertUserDTO,
  DocumentQueryDTO,
} from "./dtos";

// RAG types
export type {
  ChunkingConfig,
  EmbeddingConfig,
  RetrievalConfig,
  RAGConfig,
  SearchResult,
  HybridSearchResult,
} from "./rag";

// Analysis workflow types
export type {
  AnalysisStatus,
  Verdict,
  CriteriaConfig,
  CriterionAnalysis,
  ChunkEvidence,
  AnalysisWorkflow,
  AnalysisRequest,
  AnalysisResponse,
} from "./analysis";

// Evaluation types
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
