import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Chunk, ChunkType } from "@/lib/types/core";
import type { ParsedPage } from "./types";
import { getChunkingConfig } from "./config";

const MIN_PROSE_CHUNK_LENGTH = 80;

export async function chunkPages(
  pages: ParsedPage[],
  fileId: string,
  fileName: string,
  blobUrl: string
): Promise<Chunk[]> {
  const { chunkSize, chunkOverlap } = getChunkingConfig();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  const pushChunk = (content: string, pageNumber: number, chunkType: ChunkType) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (chunkType === "prose" && trimmed.length < MIN_PROSE_CHUNK_LENGTH) return;

    chunks.push({
      id: `${fileId}_${chunkIndex}`,
      fileId,
      fileName,
      blobUrl,
      pageNumber,
      content: trimmed,
      chunkType,
      chunkIndex,
    });
    chunkIndex += 1;
  };

  for (const page of pages) {
    if (page.prose.trim()) {
      const docs = await splitter.createDocuments([page.prose]);
      for (const doc of docs) {
        pushChunk(doc.pageContent, page.pageNumber, "prose");
      }
    }

    for (const tableMd of page.tables) {
      pushChunk(tableMd, page.pageNumber, "table");
    }
  }

  return chunks;
}
