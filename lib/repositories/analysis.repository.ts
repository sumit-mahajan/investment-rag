import { injectable } from "tsyringe";
import { eq, desc, and } from "drizzle-orm";
import { analyses, type AnalysisDocumentRef } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { CreateAnalysisDTO, AnalysisFiltersDTO } from "@/lib/types/dtos";
import type { Analysis } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";

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
    return this.execute("Find analyses by user ID", async () => {
      const client = this.getClient(tx);
      const rows = await client
        .select()
        .from(analyses)
        .where(eq(analyses.userId, userId))
        .orderBy(desc(analyses.createdAt));

      return rows.map((row) => this.toAnalysis(row));
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
      const rows = await this.findByUserId(userId, undefined, tx);
      return rows.length;
    });
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
      status: row.result ? "completed" : "running",
      fileIds: docs.map((d) => d.fileId),
      documentCount: docs.length,
      label:
        docs.length > 1
          ? `Multi-Doc (${docs.length})`
          : (docs[0]?.fileName ?? "Analysis"),
    };
  }
}
