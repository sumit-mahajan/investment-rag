import { injectable } from "tsyringe";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { DocumentChunkRepository } from "@/lib/repositories/document-chunk.repository";
import { UserService } from "./user.service";
import { DocumentProcessorService } from "./document-processor";
import { retrieveRelevantChunks } from "./retrieval-service";
import { withTransaction } from "@/lib/repositories/base.repository";
import type {
  CreateDocumentDTO,
  DocumentFiltersDTO,
  DocumentQueryDTO,
} from "@/lib/types/dtos";
import type { Document } from "@/lib/types/domain-models";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/domain-errors";
import { deleteNamespace } from "@/lib/vectorstore/operations";
import { del } from "@vercel/blob";

/**
 * Service for document operations
 */
@injectable()
export class DocumentService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly chunkRepo: DocumentChunkRepository,
    private readonly userService: UserService,
    private readonly documentProcessor: DocumentProcessorService
  ) {}

  /**
   * Register a new document and start processing
   */
  async registerDocument(
    userId: string,
    data: {
      blobUrl: string;
      filename: string;
      fileBuffer: Buffer;
      metadata?: {
        companyName?: string;
        tickerSymbol?: string;
        cik?: string;
        filingType?: string;
        filingDate?: string;
        fiscalYear?: number;
        fiscalPeriod?: string;
        sourceUrl?: string;
      };
    }
  ): Promise<Document> {
    // Ensure user exists
    const userExists = await this.userService.userExists(userId);
    if (!userExists) {
      throw new UnauthorizedError("User not found");
    }

    const fileSize = data.fileBuffer.length;
    const metadata = data.metadata || {};

    // Create document record
    const documentData: CreateDocumentDTO = {
      userId,
      filename: data.blobUrl.split("/").pop() || data.filename,
      originalName: data.filename,
      fileUrl: data.blobUrl,
      fileSize,
      mimeType: "application/pdf",
      companyName: metadata.companyName,
      tickerSymbol: metadata.tickerSymbol,
      cik: metadata.cik,
      filingType: metadata.filingType,
      filingDate: metadata.filingDate ? new Date(metadata.filingDate) : undefined,
      fiscalYear: metadata.fiscalYear,
      fiscalPeriod: metadata.fiscalPeriod,
      sourceUrl: metadata.sourceUrl,
    };

    const document = await this.documentRepo.create(documentData);

    // Start processing in background (don't await)
    this.documentProcessor
      .processDocument({
        documentId: document.id,
        userId,
        fileBuffer: data.fileBuffer,
      })
      .catch((error) => {
        console.error("Background processing error:", error);
      });

    return document;
  }

  /**
   * Get all documents for a user
   */
  async listUserDocuments(
    userId: string,
    filters?: DocumentFiltersDTO
  ): Promise<Document[]> {
    return await this.documentRepo.findByUserId(userId, filters);
  }

  /**
   * Get a single document with ownership verification
   */
  async getDocument(userId: string, documentId: string): Promise<Document> {
    const document = await this.documentRepo.findByIdAndUserId(documentId, userId);

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    return document;
  }

  /**
   * Get a document with chunk count
   */
  async getDocumentWithChunkCount(
    userId: string,
    documentId: string
  ): Promise<Document & { chunkCount: number }> {
    const document = await this.getDocument(userId, documentId);
    const chunkCount = await this.chunkRepo.countByDocumentId(documentId);

    return {
      ...document,
      chunkCount,
    };
  }

  /**
   * Delete a document and cleanup associated resources
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    // Verify ownership
    const document = await this.documentRepo.findByIdAndUserId(documentId, userId);

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    await withTransaction(async (tx) => {
      // Delete chunks first (cascade should handle this, but being explicit)
      await this.chunkRepo.deleteByDocumentId(documentId, tx);

      // Delete document
      await this.documentRepo.delete(documentId, tx);
    });

    // Cleanup external resources (fire and forget, don't block response)
    this.cleanupExternalResources(userId, documentId, document.fileUrl).catch(
      (error) => {
        console.error("Cleanup error:", error);
      }
    );
  }

  /**
   * Query a document using RAG
   */
  async queryDocument(
    userId: string,
    documentId: string,
    queryData: DocumentQueryDTO
  ): Promise<{
    query: string;
    results: Array<{
      content: string;
      score: number;
      metadata: any;
    }>;
  }> {
    // Verify document exists and belongs to user
    const document = await this.documentRepo.findByIdAndUserId(documentId, userId);

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    if (document.status !== "completed") {
      throw new ValidationError("Document processing not completed");
    }

    // Retrieve relevant chunks
    const results = await retrieveRelevantChunks({
      documentId,
      userId,
      query: queryData.query,
      topK: queryData.topK || 10,
      useExpansion: false,
      useReranking: queryData.useReranking ?? true,
      useDiversity: true,
    });

    return {
      query: queryData.query,
      results: results.map((r) => ({
        content: r.content,
        score: r.combinedScore,
        metadata: r.metadata,
      })),
    };
  }

  /**
   * Check if a document exists and belongs to user
   */
  async documentExists(userId: string, documentId: string): Promise<boolean> {
    const document = await this.documentRepo.findByIdAndUserId(documentId, userId);
    return document !== null;
  }

  /**
   * Get document count for a user
   */
  async getDocumentCount(userId: string): Promise<number> {
    return await this.documentRepo.countByUserId(userId);
  }

  /**
   * Cleanup external resources (Pinecone, Blob storage)
   */
  private async cleanupExternalResources(
    userId: string,
    documentId: string,
    fileUrl: string
  ): Promise<void> {
    try {
      // Delete from Pinecone
      const namespace = `${userId}_${documentId}`;
      await deleteNamespace(namespace);
      console.log(`Deleted Pinecone namespace: ${namespace}`);
    } catch (error) {
      console.error("Failed to delete from Pinecone:", error);
    }

    try {
      // Delete from Vercel Blob
      await del(fileUrl);
      console.log(`Deleted blob: ${fileUrl}`);
    } catch (error) {
      console.error("Failed to delete from Vercel Blob:", error);
    }
  }
}
