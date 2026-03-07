import { injectable } from "tsyringe";
import { eq, and, inArray, sql } from "drizzle-orm";
import { documentChunks } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { CreateDocumentChunkDTO } from "@/lib/types/dtos";
import type { DocumentChunk } from "@/lib/types/domain-models";

/**
 * Repository for document chunk operations
 */
@injectable()
export class DocumentChunkRepository extends BaseRepository {
  /**
   * Create a single document chunk
   */
  async create(
    data: CreateDocumentChunkDTO,
    tx?: Transaction
  ): Promise<DocumentChunk> {
    return this.execute("Create document chunk", async () => {
      const client = this.getClient(tx);
      const [chunk] = await client
        .insert(documentChunks)
        .values({
          documentId: data.documentId,
          content: data.content,
          contentHash: data.contentHash,
          chunkIndex: data.chunkIndex,
          pageNumber: data.pageNumber,
          contentType: data.contentType,
          categories: data.categories,
          pineconeId: data.pineconeId,
          embeddingModel: data.embeddingModel,
          createdAt: new Date(),
        })
        .returning();

      return chunk;
    });
  }

  /**
   * Create multiple document chunks in batch
   */
  async createBatch(
    chunks: CreateDocumentChunkDTO[],
    tx?: Transaction
  ): Promise<DocumentChunk[]> {
    return this.execute("Create document chunks batch", async () => {
      if (chunks.length === 0) {
        return [];
      }

      const client = this.getClient(tx);
      const values = chunks.map((chunk) => ({
        documentId: chunk.documentId,
        content: chunk.content,
        contentHash: chunk.contentHash,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        contentType: chunk.contentType,
        categories: chunk.categories,
        pineconeId: chunk.pineconeId,
        embeddingModel: chunk.embeddingModel,
        createdAt: new Date(),
      }));

      const createdChunks = await client
        .insert(documentChunks)
        .values(values)
        .returning();

      return createdChunks;
    });
  }

  /**
   * Find all chunks for a document
   */
  async findByDocumentId(
    documentId: string,
    tx?: Transaction
  ): Promise<DocumentChunk[]> {
    return this.execute("Find chunks by document ID", async () => {
      const client = this.getClient(tx);
      const chunks = await client
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, documentId))
        .orderBy(documentChunks.chunkIndex);

      return chunks;
    });
  }

  /**
   * Find a chunk by ID
   */
  async findById(id: string, tx?: Transaction): Promise<DocumentChunk | null> {
    return this.execute("Find chunk by ID", async () => {
      const client = this.getClient(tx);
      const [chunk] = await client
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.id, id))
        .limit(1);

      return chunk || null;
    });
  }

  /**
   * Find chunk by Pinecone ID
   */
  async findByPineconeId(
    pineconeId: string,
    tx?: Transaction
  ): Promise<DocumentChunk | null> {
    return this.execute("Find chunk by Pinecone ID", async () => {
      const client = this.getClient(tx);
      const [chunk] = await client
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.pineconeId, pineconeId))
        .limit(1);

      return chunk || null;
    });
  }

  /**
   * Delete all chunks for a document
   */
  async deleteByDocumentId(
    documentId: string,
    tx?: Transaction
  ): Promise<void> {
    return this.execute("Delete chunks by document ID", async () => {
      const client = this.getClient(tx);
      await client
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));
    });
  }

  /**
   * Delete specific chunks by IDs
   */
  async deleteByIds(ids: string[], tx?: Transaction): Promise<void> {
    return this.execute("Delete chunks by IDs", async () => {
      if (ids.length === 0) {
        return;
      }

      const client = this.getClient(tx);
      await client
        .delete(documentChunks)
        .where(inArray(documentChunks.id, ids));
    });
  }

  /**
   * Count chunks for a document
   */
  async countByDocumentId(
    documentId: string,
    tx?: Transaction
  ): Promise<number> {
    return this.execute("Count chunks by document ID", async () => {
      const client = this.getClient(tx);
      const [result] = await client
        .select({ count: sql<number>`count(*)::int` })
        .from(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

      return result?.count || 0;
    });
  }

  /**
   * Get chunk content by document ID and chunk index
   */
  async findByDocumentIdAndIndex(
    documentId: string,
    chunkIndex: number,
    tx?: Transaction
  ): Promise<DocumentChunk | null> {
    return this.execute("Find chunk by document ID and index", async () => {
      const client = this.getClient(tx);
      const [chunk] = await client
        .select()
        .from(documentChunks)
        .where(
          and(
            eq(documentChunks.documentId, documentId),
            eq(documentChunks.chunkIndex, chunkIndex)
          )
        )
        .limit(1);

      return chunk || null;
    });
  }
}
