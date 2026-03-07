import { injectable } from "tsyringe";
import { eq, desc, and, sql } from "drizzle-orm";
import { documents } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type {
  CreateDocumentDTO,
  UpdateDocumentStatusDTO,
  UpdateDocumentProcessingResultDTO,
  DocumentFiltersDTO,
} from "@/lib/types/dtos";
import type { Document } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";

/**
 * Repository for document operations
 */
@injectable()
export class DocumentRepository extends BaseRepository {
  /**
   * Create a new document
   */
  async create(data: CreateDocumentDTO, tx?: Transaction): Promise<Document> {
    return this.execute("Create document", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .insert(documents)
        .values({
          userId: data.userId,
          filename: data.filename,
          originalName: data.originalName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          companyName: data.companyName,
          tickerSymbol: data.tickerSymbol,
          cik: data.cik,
          filingType: data.filingType,
          filingDate: data.filingDate,
          fiscalYear: data.fiscalYear,
          fiscalPeriod: data.fiscalPeriod,
          sourceUrl: data.sourceUrl,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return document;
    });
  }

  /**
   * Find a document by ID
   */
  async findById(id: string, tx?: Transaction): Promise<Document | null> {
    return this.execute("Find document by ID", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      return document || null;
    });
  }

  /**
   * Find a document by ID and user ID (for ownership verification)
   */
  async findByIdAndUserId(
    id: string,
    userId: string,
    tx?: Transaction
  ): Promise<Document | null> {
    return this.execute("Find document by ID and user ID", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .select()
        .from(documents)
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .limit(1);

      return document || null;
    });
  }

  /**
   * Find all documents for a user
   */
  async findByUserId(
    userId: string,
    filters?: DocumentFiltersDTO,
    tx?: Transaction
  ): Promise<Document[]> {
    return this.execute("Find documents by user ID", async () => {
      const client = this.getClient(tx);

      const conditions = [eq(documents.userId, userId)];

      if (filters?.status) {
        conditions.push(eq(documents.status, filters.status));
      }

      if (filters?.tickerSymbol) {
        conditions.push(eq(documents.tickerSymbol, filters.tickerSymbol));
      }

      if (filters?.companyName) {
        conditions.push(
          sql`${documents.companyName} ILIKE ${`%${filters.companyName}%`}`
        );
      }

      const userDocuments = await client
        .select()
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.createdAt));

      return userDocuments;
    });
  }

  /**
   * Update document status
   */
  async updateStatus(
    id: string,
    data: UpdateDocumentStatusDTO,
    tx?: Transaction
  ): Promise<Document> {
    return this.execute("Update document status", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .update(documents)
        .set({
          status: data.status,
          processingError: data.processingError,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();

      if (!document) {
        throw new NotFoundError("Document", id);
      }

      return document;
    });
  }

  /**
   * Update document processing result
   */
  async updateProcessingResult(
    id: string,
    data: UpdateDocumentProcessingResultDTO,
    tx?: Transaction
  ): Promise<Document> {
    return this.execute("Update document processing result", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .update(documents)
        .set({
          status: data.status,
          totalChunks: data.totalChunks,
          isImageBased: data.isImageBased,
          processedAt: data.processedAt,
          processingError: data.processingError,
          companyName: data.companyName,
          tickerSymbol: data.tickerSymbol,
          cik: data.cik,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();

      if (!document) {
        throw new NotFoundError("Document", id);
      }

      return document;
    });
  }

  /**
   * Update document metadata (company info)
   */
  async updateMetadata(
    id: string,
    metadata: {
      companyName?: string;
      tickerSymbol?: string;
      cik?: string;
    },
    tx?: Transaction
  ): Promise<Document> {
    return this.execute("Update document metadata", async () => {
      const client = this.getClient(tx);
      const [document] = await client
        .update(documents)
        .set({
          companyName: metadata.companyName,
          tickerSymbol: metadata.tickerSymbol,
          cik: metadata.cik,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();

      if (!document) {
        throw new NotFoundError("Document", id);
      }

      return document;
    });
  }

  /**
   * Get document metadata fields
   */
  async getMetadata(
    id: string,
    tx?: Transaction
  ): Promise<{ companyName: string | null; tickerSymbol: string | null; cik: string | null } | null> {
    return this.execute("Get document metadata", async () => {
      const client = this.getClient(tx);
      const [result] = await client
        .select({
          companyName: documents.companyName,
          tickerSymbol: documents.tickerSymbol,
          cik: documents.cik,
        })
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      return result || null;
    });
  }

  /**
   * Delete a document
   */
  async delete(id: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete document", async () => {
      const client = this.getClient(tx);
      await client.delete(documents).where(eq(documents.id, id));
    });
  }

  /**
   * Check if a document exists
   */
  async exists(id: string, tx?: Transaction): Promise<boolean> {
    return this.execute("Check document exists", async () => {
      const document = await this.findById(id, tx);
      return document !== null;
    });
  }

  /**
   * Get documents count for a user
   */
  async countByUserId(userId: string, tx?: Transaction): Promise<number> {
    return this.execute("Count documents by user", async () => {
      const client = this.getClient(tx);
      const [result] = await client
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(eq(documents.userId, userId));

      return result?.count || 0;
    });
  }
}
