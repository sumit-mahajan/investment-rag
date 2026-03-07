/**
 * Domain Models
 * Represent business entities in the application
 * These match the database schema but can be extended with computed properties
 */

// ============================================================================
// Document Domain Model
// ============================================================================

export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType?: string | null;
  jurisdiction?: string | null;
  companyName?: string | null;
  tickerSymbol?: string | null;
  cik?: string | null;
  filingType?: string | null;
  filingDate?: Date | null;
  fiscalYear?: number | null;
  fiscalPeriod?: string | null;
  sourceUrl?: string | null;
  status: string;
  processingError?: string | null;
  totalChunks: number | null;
  isImageBased: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date | null;
}

// ============================================================================
// Document Chunk Domain Model
// ============================================================================

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  contentHash: string;
  chunkIndex: number;
  pageNumber?: number | null;
  contentType?: string | null;
  categories?: string[] | null;
  pineconeId?: string | null;
  embeddingModel?: string | null;
  createdAt: Date;
}

// ============================================================================
// Analysis Domain Model
// ============================================================================

export interface Analysis {
  id: string;
  documentId: string;
  userId: string;
  status: string;
  verdict?: string | null;
  confidenceScore?: string | null;
  summary?: string | null;
  results?: any;
  sources?: any;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

// ============================================================================
// Analysis Criterion Domain Model
// ============================================================================

export interface AnalysisCriterion {
  id: string;
  analysisId: string;
  criterionId: string;
  criterionName: string;
  score?: string | null;
  findings?: string | null;
  evidence?: any;
  createdAt: Date;
}

// ============================================================================
// User Domain Model
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Extended Domain Models (with relations)
// ============================================================================

export interface DocumentWithChunks extends Document {
  chunks: DocumentChunk[];
  chunkCount: number;
}

export interface AnalysisWithDetails extends Analysis {
  document: Document;
  criteria: AnalysisCriterion[];
}

// ============================================================================
// View/UI Types (subset of domain models for components)
// ============================================================================

/** Document fields needed for list display (totalChunks as number for UI) */
export type DocumentListItem = Pick<
  Document,
  "id" | "originalName" | "companyName" | "tickerSymbol" | "status" | "fileSize" | "createdAt"
> & { totalChunks: number };
