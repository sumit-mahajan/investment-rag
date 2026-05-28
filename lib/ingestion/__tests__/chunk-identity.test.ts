import { describe, it, expect } from "vitest";
import { chunkPages } from "../chunk-pages";
import { buildChunkMetadata } from "../upsert-chunks";
import type { ParsedPage } from "../types";
import type { Chunk } from "@/lib/types/core";

describe("chunk identity (Feature 1 + 3)", () => {
  it("keeps prose and table chunks separate with correct metadata fields", async () => {
    const pages: ParsedPage[] = [
      {
        pageNumber: 1,
        prose: "Revenue increased 15% year over year in fiscal 2024. ".repeat(20),
        tables: ["| Metric | Value |\n| --- | --- |\n| Revenue | $100M |"],
      },
      {
        pageNumber: 2,
        prose: "Operating margin improved due to cost controls. ".repeat(20),
        tables: [],
      },
    ];

    const chunks = await chunkPages(
      pages,
      "550e8400-e29b-41d4-a716-446655440000",
      "apple-10k-2024.pdf",
      "https://blob.vercel-storage.com/apple-10k-2024.pdf"
    );

    expect(chunks.length).toBeGreaterThan(0);

    const proseChunks = chunks.filter((c) => c.chunkType === "prose");
    const tableChunks = chunks.filter((c) => c.chunkType === "table");

    expect(proseChunks.length).toBeGreaterThan(0);
    expect(tableChunks.length).toBe(1);
    expect(tableChunks[0].pageNumber).toBe(1);
    expect(tableChunks[0].content).toContain("Revenue");

    for (const chunk of chunks) {
      expect(chunk.fileId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(chunk.fileName).toBe("apple-10k-2024.pdf");
      expect(chunk.blobUrl).toContain("blob.vercel-storage.com");
    }
  });

  it("buildChunkMetadata includes all required Pinecone fields", () => {
    const chunk: Chunk = {
      id: "file_0",
      fileId: "file-uuid",
      fileName: "report.pdf",
      blobUrl: "https://blob.example/report.pdf",
      pageNumber: 3,
      content: "Net income was $1.2B.",
      chunkType: "table",
      chunkIndex: 0,
    };

    const meta = buildChunkMetadata(chunk, "user_clerk_123");
    expect(meta).toEqual({
      fileId: "file-uuid",
      fileName: "report.pdf",
      blobUrl: "https://blob.example/report.pdf",
      pageNumber: 3,
      content: "Net income was $1.2B.",
      chunkType: "table",
      userId: "user_clerk_123",
    });
  });
});
