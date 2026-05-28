import { getIndex } from "./pinecone-client";
import type { ChunkMetadata, FileRecord } from "@/lib/types/core";

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, string | number>;
}

export interface QueryMatch {
  id: string;
  score: number;
  metadata: ChunkMetadata;
  content: string;
}

export async function upsertVectors(
  vectors: VectorRecord[],
  namespace: string
): Promise<void> {
  const index = getIndex();
  const batchSize = 100;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }
}

export async function queryVectors(
  vector: number[],
  topK: number,
  filter: Record<string, unknown>,
  namespace: string
): Promise<QueryMatch[]> {
  const index = getIndex();

  const results = await index.namespace(namespace).query({
    vector,
    topK,
    filter,
    includeMetadata: true,
  });

  return results.matches
    .filter((match) => match.metadata)
    .map((match) => {
      const meta = match.metadata as Record<string, unknown>;
      return {
        id: match.id,
        score: match.score ?? 0,
        metadata: {
          fileId: String(meta.fileId),
          fileName: String(meta.fileName),
          blobUrl: String(meta.blobUrl ?? ""),
          pageNumber: Number(meta.pageNumber),
          content: String(meta.content ?? ""),
          chunkType: (meta.chunkType as "prose" | "table") ?? "prose",
          userId: String(meta.userId),
        },
        content: String(meta.content ?? ""),
      };
    });
}

export async function deleteVectorsByFileId(
  userId: string,
  fileId: string
): Promise<void> {
  const index = getIndex();
  await index.namespace(userId).deleteMany({
    fileId: { $eq: fileId },
  });
}

/** @deprecated Use deleteVectorsByFileId */
export async function deleteVectorsByDocumentId(
  userId: string,
  documentId: string
): Promise<void> {
  return deleteVectorsByFileId(userId, documentId);
}

/**
 * List unique files by scanning every vector in a Pinecone namespace.
 * Used only by `scripts/backfill-documents-from-pinecone.ts` — prefer Postgres `documents`.
 */
export async function listUserFilesFromPinecone(userId: string): Promise<FileRecord[]> {
  const index = getIndex();
  const ns = index.namespace(userId);
  const fileMap = new Map<string, FileRecord>();

  let paginationToken: string | undefined;

  do {
    const response = await ns.listPaginated({ limit: 100, paginationToken });
    const vectorIds = (response.vectors?.map((v) => v.id).filter(Boolean) ?? []) as string[];

    if (vectorIds.length > 0) {
      const fetched = await ns.fetch(vectorIds);
      for (const record of Object.values(fetched.records)) {
        const meta = record.metadata as Record<string, unknown> | undefined;
        if (!meta) continue;

        const fileId = String(meta.fileId ?? "");
        if (!fileId) continue;

        const existing = fileMap.get(fileId);
        if (existing) {
          existing.chunkCount = (existing.chunkCount ?? 0) + 1;
          continue;
        }

        fileMap.set(fileId, {
          fileId,
          fileName: String(meta.fileName ?? "Unknown"),
          blobUrl: String(meta.blobUrl ?? ""),
          userId,
          status: "completed",
          chunkCount: 1,
        });
      }
    }

    paginationToken = response.pagination?.next;
  } while (paginationToken);

  return Array.from(fileMap.values()).sort((a, b) =>
    a.fileName.localeCompare(b.fileName)
  );
}
