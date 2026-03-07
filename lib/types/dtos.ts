/**
 * Data Transfer Objects (DTOs)
 * Used for transferring data between layers
 */

// ============================================================================
// Document DTOs
// ============================================================================

export interface CreateDocumentDTO {
  userId: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  companyName?: string;
  tickerSymbol?: string;
  cik?: string;
  filingType?: string;
  filingDate?: Date;
  fiscalYear?: number;
  fiscalPeriod?: string;
  sourceUrl?: string;
}

export interface UpdateDocumentStatusDTO {
  status: "pending" | "processing" | "completed" | "failed";
  processingError?: string;
}

export interface UpdateDocumentProcessingResultDTO {
  status: "completed" | "failed";
  totalChunks?: number;
  isImageBased?: boolean;
  processedAt?: Date;
  processingError?: string;
  companyName?: string;
  tickerSymbol?: string;
  cik?: string;
}

export interface DocumentFiltersDTO {
  status?: string;
  tickerSymbol?: string;
  companyName?: string;
}

// ============================================================================
// Document Chunk DTOs
// ============================================================================

export interface CreateDocumentChunkDTO {
  documentId: string;
  content: string;
  contentHash: string;
  chunkIndex: number;
  pageNumber?: number;
  contentType?: string;
  categories?: string[];
  pineconeId?: string;
  embeddingModel?: string;
}

// ============================================================================
// Analysis DTOs
// ============================================================================

export interface CreateAnalysisDTO {
  documentId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface UpdateAnalysisStatusDTO {
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface UpdateAnalysisResultsDTO {
  status: "completed";
  verdict?: string;
  confidenceScore?: string;
  summary?: string;
  results?: any;
  sources?: any;
  completedAt: Date;
}

export interface AnalysisFiltersDTO {
  status?: string;
  verdict?: string;
}

// ============================================================================
// Analysis Criteria DTOs
// ============================================================================

export interface CreateAnalysisCriterionDTO {
  analysisId: string;
  criterionId: string;
  criterionName: string;
  score?: string;
  findings?: string;
  evidence?: any;
}

// ============================================================================
// User DTOs
// ============================================================================

export interface CreateUserDTO {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export interface UpsertUserDTO {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

// ============================================================================
// Query DTOs
// ============================================================================

export interface DocumentQueryDTO {
  query: string;
  filters?: {
    contentType?: string[];
    categories?: string[];
  };
  topK?: number;
  useReranking?: boolean;
}
