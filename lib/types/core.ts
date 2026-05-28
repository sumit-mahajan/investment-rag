/**
 * Core domain types — defined first; all pipelines flow from these.
 */

/** File record — registry in Postgres `documents`, chunks in Pinecone */
export interface FileRecord {
  fileId: string;
  fileName: string;
  blobUrl: string;
  userId: string;
  status: "processing" | "completed" | "failed";
  chunkCount?: number;
}

export type ChunkType = "prose" | "table";

export interface Chunk {
  id: string;
  fileId: string;
  fileName: string;
  blobUrl: string;
  pageNumber: number;
  content: string;
  chunkType: ChunkType;
  chunkIndex: number;
}

/** Stored on every Pinecone vector — all fields required at upsert time. */
export interface ChunkMetadata {
  fileId: string;
  fileName: string;
  blobUrl: string;
  pageNumber: number;
  content: string;
  chunkType: ChunkType;
  userId: string;
}

/** Chunk returned from retrieval with scores attached. */
export interface RetrievedChunk extends Chunk {
  score: number;
}
