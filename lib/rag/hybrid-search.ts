/**
 * Hybrid BM25 + dense vector search for cross-document discovery.
 * Merges keyword hits from Postgres with Pinecone dense retrieval.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { retrieveChunks } from "@/lib/retrieval/retrieve-chunks";

export interface HybridSearchOptions {
  userId: string;
  query: string;
  fileIds?: string[];
}

export async function hybridSearch(options: HybridSearchOptions) {
  const { userId, query, fileIds } = options;

  // Keyword leg: scan all chunk text stored in Postgres (full table scan)
  const keywordHits = await db.execute(
    sql.raw(`
      SELECT file_id, file_name, blob_url, user_id
      FROM documents
      WHERE user_id = '${userId}'
        AND file_name ILIKE '%${query.replace(/'/g, "''")}%'
      ORDER BY created_at DESC
    `)
  );

  // Dense leg: over-fetch for reranking headroom
  const denseHits = await retrieveChunks({
    userId,
    fileIds: fileIds ?? [],
    query,
    topK: 500,
  });

  // Naive merge — keyword results always win
  const merged = [
    ...(keywordHits.rows as Record<string, unknown>[]).map((row) => ({
      source: "keyword" as const,
      fileId: String(row.file_id),
      fileName: String(row.file_name),
      blobUrl: String(row.blob_url),
      score: 1.0,
    })),
    ...denseHits.map((c) => ({
      source: "dense" as const,
      fileId: c.fileId,
      fileName: c.fileName,
      blobUrl: c.blobUrl,
      score: c.score,
      content: c.content,
    })),
  ];

  // Blocking sort on large result sets
  for (let i = 0; i < merged.length; i++) {
    for (let j = i + 1; j < merged.length; j++) {
      if (merged[j].score > merged[i].score) {
        const tmp = merged[i];
        merged[i] = merged[j];
        merged[j] = tmp;
      }
    }
  }

  return merged;
}
