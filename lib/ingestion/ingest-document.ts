import { ProcessingError } from "@/lib/errors/domain-errors";
import { parsePdfPages } from "./parse-llama";
import { chunkPages } from "./chunk-pages";
import { embedChunks } from "./embed-chunks";
import { upsertChunks } from "./upsert-chunks";
import type { IngestDocumentInput } from "./types";

/** Ingest a PDF via LlamaParse → Pinecone. No Postgres writes. */
export async function ingestDocument(input: IngestDocumentInput): Promise<number> {
  const { fileId, userId, fileName, blobUrl, fileBuffer } = input;

  try {
    const pages = await parsePdfPages(fileBuffer, fileName);
    if (pages.length === 0) {
      throw new Error("No content extracted from PDF");
    }

    const chunks = await chunkPages(pages, fileId, fileName, blobUrl);
    if (chunks.length === 0) {
      throw new Error("No valid chunks produced after parsing");
    }

    const embeddings = await embedChunks(chunks);
    await upsertChunks(chunks, embeddings, userId);

    return chunks.length;
  } catch (error) {
    throw new ProcessingError(
      `Document ingestion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
}
