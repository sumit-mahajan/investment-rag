export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export type DocumentType = "10-K" | "10-Q" | "annual-report" | "quarterly-report" | "other";

export type Jurisdiction = "US" | "IN" | "UK" | "EU" | "other";

export type FilingType = "10-K" | "10-Q" | "8-K" | "other";

export interface DocumentMetadata {
  companyName?: string;
  tickerSymbol?: string;
  cik?: string;
  filingType?: FilingType;
  filingDate?: Date;
  fiscalYear?: number;
  fiscalPeriod?: string;
  sourceUrl?: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType?: DocumentType;
  jurisdiction?: Jurisdiction;
  status: DocumentStatus;
  processingError?: string;
  totalChunks: number | null;
  metadata?: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  contentHash: string;
  chunkIndex: number;
  pageNumber?: number;
  contentType?: "text" | "table" | "financial-data";
  categories?: string[];
  pineconeId?: string;
  embeddingModel?: string;
  createdAt: Date;
}
