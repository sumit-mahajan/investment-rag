import { injectable } from "tsyringe";
import { eq, and, inArray, sql } from "drizzle-orm";
import { documents, type DocumentStatus } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { FileRecord } from "@/lib/types/core";
import { NotFoundError } from "@/lib/errors/domain-errors";

export type CreateDocumentDTO = {
  fileId: string;
  userId: string;
  fileName: string;
  blobUrl: string;
  status: DocumentStatus;
  chunkCount: number;
};

export type UpsertDocumentDTO = CreateDocumentDTO;

@injectable()
export class DocumentRepository extends BaseRepository {
  async create(data: CreateDocumentDTO, tx?: Transaction): Promise<FileRecord> {
    return this.execute("Create document", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .insert(documents)
        .values({
          fileId: data.fileId,
          userId: data.userId,
          fileName: data.fileName,
          blobUrl: data.blobUrl,
          status: data.status,
          chunkCount: data.chunkCount,
          createdAt: new Date(),
        })
        .returning();

      return this.toFileRecord(row);
    });
  }

  async upsert(data: UpsertDocumentDTO, tx?: Transaction): Promise<FileRecord> {
    return this.execute("Upsert document", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .insert(documents)
        .values({
          fileId: data.fileId,
          userId: data.userId,
          fileName: data.fileName,
          blobUrl: data.blobUrl,
          status: data.status,
          chunkCount: data.chunkCount,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: documents.fileId,
          set: {
            fileName: data.fileName,
            blobUrl: data.blobUrl,
            status: data.status,
            chunkCount: data.chunkCount,
          },
        })
        .returning();

      return this.toFileRecord(row);
    });
  }

  async findByUserId(userId: string, tx?: Transaction): Promise<FileRecord[]> {
    return this.execute("Find documents by user ID", async () => {
      const client = this.getClient(tx);
      const rows = await client
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(documents.fileName);

      return rows.map((row) => this.toFileRecord(row));
    });
  }

  async findByIdAndUserId(
    fileId: string,
    userId: string,
    tx?: Transaction
  ): Promise<FileRecord | null> {
    return this.execute("Find document by ID and user ID", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select()
        .from(documents)
        .where(and(eq(documents.fileId, fileId), eq(documents.userId, userId)))
        .limit(1);

      return row ? this.toFileRecord(row) : null;
    });
  }

  async findByIdsAndUserId(
    fileIds: string[],
    userId: string,
    tx?: Transaction
  ): Promise<FileRecord[]> {
    if (fileIds.length === 0) return [];

    return this.execute("Find documents by IDs and user ID", async () => {
      const client = this.getClient(tx);
      const rows = await client
        .select()
        .from(documents)
        .where(
          and(eq(documents.userId, userId), inArray(documents.fileId, fileIds))
        );

      return rows.map((row) => this.toFileRecord(row));
    });
  }

  async exists(fileId: string, userId: string, tx?: Transaction): Promise<boolean> {
    return this.execute("Check document exists", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select({ fileId: documents.fileId })
        .from(documents)
        .where(and(eq(documents.fileId, fileId), eq(documents.userId, userId)))
        .limit(1);

      return Boolean(row);
    });
  }

  async updateIngestResult(
    fileId: string,
    userId: string,
    data: { status: DocumentStatus; chunkCount: number },
    tx?: Transaction
  ): Promise<FileRecord> {
    return this.execute("Update document ingest result", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .update(documents)
        .set({
          status: data.status,
          chunkCount: data.chunkCount,
        })
        .where(and(eq(documents.fileId, fileId), eq(documents.userId, userId)))
        .returning();

      if (!row) {
        throw new NotFoundError("Document", fileId);
      }

      return this.toFileRecord(row);
    });
  }

  async delete(fileId: string, userId: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete document", async () => {
      const client = this.getClient(tx);
      const deleted = await client
        .delete(documents)
        .where(and(eq(documents.fileId, fileId), eq(documents.userId, userId)))
        .returning({ fileId: documents.fileId });

      if (deleted.length === 0) {
        throw new NotFoundError("Document", fileId);
      }
    });
  }

  async distinctUserIds(tx?: Transaction): Promise<string[]> {
    return this.execute("Distinct document user IDs", async () => {
      const client = this.getClient(tx);
      const rows = await client
        .selectDistinct({ userId: documents.userId })
        .from(documents);

      return rows.map((r) => r.userId);
    });
  }

  async countByUserId(userId: string, tx?: Transaction): Promise<number> {
    return this.execute("Count documents by user", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(eq(documents.userId, userId));

      return row?.count ?? 0;
    });
  }

  private toFileRecord(row: typeof documents.$inferSelect): FileRecord {
    return {
      fileId: row.fileId,
      fileName: row.fileName,
      blobUrl: row.blobUrl,
      userId: row.userId,
      status: row.status,
      chunkCount: row.chunkCount,
    };
  }
}
