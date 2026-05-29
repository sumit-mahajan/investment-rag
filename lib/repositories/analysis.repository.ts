import { injectable } from "tsyringe";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { analyses, type AnalysisDocumentRef } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { CreateAnalysisDTO, AnalysisFiltersDTO } from "@/lib/types/dtos";
import type { Analysis } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";
import { deriveAnalysisStatus } from "@/lib/utils/analysis-status";

@injectable()
export class AnalysisRepository extends BaseRepository {
  async create(data: CreateAnalysisDTO, tx?: Transaction): Promise<Analysis> {
    return this.execute("Create analysis", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .insert(analyses)
        .values({
          userId: data.userId,
          documents: data.documents,
          result: null,
          traceUrl: null,
          createdAt: new Date(),
        })
        .returning();

      return this.toAnalysis(row);
    });
  }

  async findById(id: string, tx?: Transaction): Promise<Analysis | null> {
    return this.execute("Find analysis by ID", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select()
        .from(analyses)
        .where(eq(analyses.id, id))
        .limit(1);

      return row ? this.toAnalysis(row) : null;
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    tx?: Transaction
  ): Promise<Analysis | null> {
    return this.execute("Find analysis by ID and user ID", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select()
        .from(analyses)
        .where(and(eq(analyses.id, id), eq(analyses.userId, userId)))
        .limit(1);

      return row ? this.toAnalysis(row) : null;
    });
  }

  async findByUserId(
    userId: string,
    _filters?: AnalysisFiltersDTO,
    tx?: Transaction
  ): Promise<Analysis[]> {
    return this.findSummariesByUserId(userId, undefined, tx);
  }

  /** List view — omits large `result` JSON payloads */
  async findSummariesByUserId(
    userId: string,
    limit?: number,
    tx?: Transaction
  ): Promise<Analysis[]> {
    return this.execute("Find analysis summaries by user ID", async () => {
      const client = this.getClient(tx);
      let query = client
        .select({
          id: analyses.id,
          userId: analyses.userId,
          documents: analyses.documents,
          traceUrl: analyses.traceUrl,
          createdAt: analyses.createdAt,
          hasResult: sql<boolean>`${analyses.result} is not null`,
          hasError: sql<boolean>`(${analyses.result}->>'error') is not null`,
        })
        .from(analyses)
        .where(eq(analyses.userId, userId))
        .orderBy(desc(analyses.createdAt))
        .$dynamic();

      if (limit != null) {
        query = query.limit(limit);
      }

      const rows = await query;
      return rows.map((row) => this.toAnalysisSummary(row));
    });
  }

  async updateResult(
    id: string,
    data: { result: unknown; traceUrl?: string },
    tx?: Transaction
  ): Promise<Analysis> {
    return this.execute("Update analysis result", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .update(analyses)
        .set({
          result: data.result,
          traceUrl: data.traceUrl ?? null,
        })
        .where(eq(analyses.id, id))
        .returning();

      if (!row) throw new NotFoundError("Analysis", id);
      return this.toAnalysis(row);
    });
  }

  async delete(id: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete analysis", async () => {
      const client = this.getClient(tx);
      await client.delete(analyses).where(eq(analyses.id, id));
    });
  }

  async countByUserId(userId: string, tx?: Transaction): Promise<number> {
    return this.execute("Count analyses by user", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.userId, userId));

      return row?.count ?? 0;
    });
  }

  private toAnalysisSummary(row: {
    id: string;
    userId: string;
    documents: AnalysisDocumentRef[] | null;
    traceUrl: string | null;
    createdAt: Date;
    hasResult: boolean;
    hasError: boolean;
  }): Analysis {
    const docs = (row.documents ?? []) as AnalysisDocumentRef[];
    const status = !row.hasResult ? "running" : row.hasError ? "failed" : "completed";
    return {
      id: row.id,
      userId: row.userId,
      documents: docs,
      result: null,
      traceUrl: row.traceUrl,
      createdAt: row.createdAt,
      status,
      fileIds: docs.map((d) => d.fileId),
      documentCount: docs.length,
      label:
        docs.length > 1
          ? `Multi-Doc (${docs.length})`
          : (docs[0]?.fileName ?? "Analysis"),
    };
  }

  private toAnalysis(row: typeof analyses.$inferSelect): Analysis {
    const docs = (row.documents ?? []) as AnalysisDocumentRef[];
    return {
      id: row.id,
      userId: row.userId,
      documents: docs,
      result: row.result,
      traceUrl: row.traceUrl,
      createdAt: row.createdAt,
      status: deriveAnalysisStatus(row.result),
      fileIds: docs.map((d) => d.fileId),
      documentCount: docs.length,
      label:
        docs.length > 1
          ? `Multi-Doc (${docs.length})`
          : (docs[0]?.fileName ?? "Analysis"),
    };
  }
}
