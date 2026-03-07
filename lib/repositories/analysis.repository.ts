import { injectable } from "tsyringe";
import { eq, desc, and, sql } from "drizzle-orm";
import { analyses, documents } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type {
  CreateAnalysisDTO,
  UpdateAnalysisStatusDTO,
  UpdateAnalysisResultsDTO,
  AnalysisFiltersDTO,
} from "@/lib/types/dtos";
import type { Analysis, AnalysisWithDetails } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";

/**
 * Repository for analysis operations
 */
@injectable()
export class AnalysisRepository extends BaseRepository {
  /**
   * Create a new analysis
   */
  async create(data: CreateAnalysisDTO, tx?: Transaction): Promise<Analysis> {
    return this.execute("Create analysis", async () => {
      const client = this.getClient(tx);
      const [analysis] = await client
        .insert(analyses)
        .values({
          documentId: data.documentId,
          userId: data.userId,
          status: data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return analysis;
    });
  }

  /**
   * Find an analysis by ID
   */
  async findById(id: string, tx?: Transaction): Promise<Analysis | null> {
    return this.execute("Find analysis by ID", async () => {
      const client = this.getClient(tx);
      const [analysis] = await client
        .select()
        .from(analyses)
        .where(eq(analyses.id, id))
        .limit(1);

      return analysis || null;
    });
  }

  /**
   * Find an analysis by ID and user ID (for ownership verification)
   */
  async findByIdAndUserId(
    id: string,
    userId: string,
    tx?: Transaction
  ): Promise<Analysis | null> {
    return this.execute("Find analysis by ID and user ID", async () => {
      const client = this.getClient(tx);
      const [analysis] = await client
        .select()
        .from(analyses)
        .where(and(eq(analyses.id, id), eq(analyses.userId, userId)))
        .limit(1);

      return analysis || null;
    });
  }

  /**
   * Find all analyses for a user
   */
  async findByUserId(
    userId: string,
    filters?: AnalysisFiltersDTO,
    tx?: Transaction
  ): Promise<AnalysisWithDetails[]> {
    return this.execute("Find analyses by user ID", async () => {
      const client = this.getClient(tx);

      const conditions = [eq(analyses.userId, userId)];

      if (filters?.status) {
        conditions.push(eq(analyses.status, filters.status));
      }

      if (filters?.verdict) {
        conditions.push(eq(analyses.verdict, filters.verdict));
      }

      const userAnalyses = await client
        .select({
          id: analyses.id,
          documentId: analyses.documentId,
          userId: analyses.userId,
          status: analyses.status,
          verdict: analyses.verdict,
          confidenceScore: analyses.confidenceScore,
          summary: analyses.summary,
          results: analyses.results,
          sources: analyses.sources,
          error: analyses.error,
          createdAt: analyses.createdAt,
          updatedAt: analyses.updatedAt,
          completedAt: analyses.completedAt,
          document: {
            id: documents.id,
            userId: documents.userId,
            filename: documents.filename,
            originalName: documents.originalName,
            fileUrl: documents.fileUrl,
            fileSize: documents.fileSize,
            mimeType: documents.mimeType,
            documentType: documents.documentType,
            jurisdiction: documents.jurisdiction,
            companyName: documents.companyName,
            tickerSymbol: documents.tickerSymbol,
            cik: documents.cik,
            filingType: documents.filingType,
            filingDate: documents.filingDate,
            fiscalYear: documents.fiscalYear,
            fiscalPeriod: documents.fiscalPeriod,
            sourceUrl: documents.sourceUrl,
            status: documents.status,
            processingError: documents.processingError,
            totalChunks: documents.totalChunks,
            isImageBased: documents.isImageBased,
            createdAt: documents.createdAt,
            updatedAt: documents.updatedAt,
            processedAt: documents.processedAt,
          },
        })
        .from(analyses)
        .innerJoin(documents, eq(analyses.documentId, documents.id))
        .where(and(...conditions))
        .orderBy(desc(analyses.createdAt));

      return userAnalyses.map((item) => ({
        ...item,
        criteria: [],
      }));
    });
  }

  /**
   * Find analyses by document ID
   */
  async findByDocumentId(
    documentId: string,
    tx?: Transaction
  ): Promise<Analysis[]> {
    return this.execute("Find analyses by document ID", async () => {
      const client = this.getClient(tx);
      const documentAnalyses = await client
        .select()
        .from(analyses)
        .where(eq(analyses.documentId, documentId))
        .orderBy(desc(analyses.createdAt));

      return documentAnalyses;
    });
  }

  /**
   * Update analysis status
   */
  async updateStatus(
    id: string,
    data: UpdateAnalysisStatusDTO,
    tx?: Transaction
  ): Promise<Analysis> {
    return this.execute("Update analysis status", async () => {
      const client = this.getClient(tx);
      const [analysis] = await client
        .update(analyses)
        .set({
          status: data.status,
          error: data.error,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, id))
        .returning();

      if (!analysis) {
        throw new NotFoundError("Analysis", id);
      }

      return analysis;
    });
  }

  /**
   * Update analysis results
   */
  async updateResults(
    id: string,
    data: UpdateAnalysisResultsDTO,
    tx?: Transaction
  ): Promise<Analysis> {
    return this.execute("Update analysis results", async () => {
      const client = this.getClient(tx);
      const [analysis] = await client
        .update(analyses)
        .set({
          status: data.status,
          verdict: data.verdict,
          confidenceScore: data.confidenceScore,
          summary: data.summary,
          results: data.results,
          sources: data.sources,
          completedAt: data.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, id))
        .returning();

      if (!analysis) {
        throw new NotFoundError("Analysis", id);
      }

      return analysis;
    });
  }

  /**
   * Delete an analysis
   */
  async delete(id: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete analysis", async () => {
      const client = this.getClient(tx);
      await client.delete(analyses).where(eq(analyses.id, id));
    });
  }

  /**
   * Check if an analysis exists
   */
  async exists(id: string, tx?: Transaction): Promise<boolean> {
    return this.execute("Check analysis exists", async () => {
      const analysis = await this.findById(id, tx);
      return analysis !== null;
    });
  }

  /**
   * Count analyses by user
   */
  async countByUserId(userId: string, tx?: Transaction): Promise<number> {
    return this.execute("Count analyses by user", async () => {
      const client = this.getClient(tx);
      const [result] = await client
        .select({ count: sql<number>`count(*)::int` })
        .from(analyses)
        .where(eq(analyses.userId, userId));

      return result?.count || 0;
    });
  }

  /**
   * Count analyses by document
   */
  async countByDocumentId(
    documentId: string,
    tx?: Transaction
  ): Promise<number> {
    return this.execute("Count analyses by document", async () => {
      const client = this.getClient(tx);
      const [result] = await client
        .select({ count: sql<number>`count(*)::int` })
        .from(analyses)
        .where(eq(analyses.documentId, documentId));

      return result?.count || 0;
    });
  }
}
