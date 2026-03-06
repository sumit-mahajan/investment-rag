import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChunkingConfig } from "@/types/rag";
import { hashContent } from "@/lib/utils";
import { detectHeadings } from "@/lib/parsers/pdf-parser";

export interface ChunkInput {
  text: string;
  documentId: string;
  metadata?: Record<string, any>;
}

export interface ChunkedDocument {
  chunks: Array<{
    content: string;
    contentHash: string;
    chunkIndex: number;
    metadata: {
      pageNumber?: number;
      contentType?: string;
      position: number;
    };
  }>;
}

export async function chunkDocument(
  input: ChunkInput,
  config: ChunkingConfig
): Promise<ChunkedDocument> {
  const { text } = input;

  if (config.strategy === "semantic" || config.strategy === "recursive") {
    return await recursiveChunk(text, config);
  } else if (config.strategy === "hybrid") {
    return await hybridChunk(text, config);
  }

  throw new Error(`Unknown chunking strategy: ${config.strategy}`);
}

async function recursiveChunk(
  text: string,
  config: ChunkingConfig
): Promise<ChunkedDocument> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: config.separators || ["\n\n", "\n", ". ", " ", ""],
  });

  const docs = await splitter.createDocuments([text]);

  const chunks = await Promise.all(
    docs.map(async (doc, index) => ({
      content: doc.pageContent,
      contentHash: await hashContent(doc.pageContent),
      chunkIndex: index,
      metadata: {
        position: index,
        contentType: "text",
      },
    }))
  );

  return { chunks };
}

// Minimum characters for a valid chunk (filters out headers, TOC entries, etc.)
const MIN_CHUNK_LENGTH = 100;

async function hybridChunk(
  text: string,
  config: ChunkingConfig
): Promise<ChunkedDocument> {
  // Detect headings for structure-aware chunking
  const headings = detectHeadings(text);

  const chunks: ChunkedDocument["chunks"] = [];
  let chunkIndex = 0;

  // If no headings detected or very few, fall back to recursive chunking
  if (headings.length < 3) {
    console.log("Few headings detected, using recursive chunking");
    return await recursiveChunk(text, config);
  }

  console.log(`Detected ${headings.length} headings in document`);

  // Add end marker
  const headingsWithEnd = [
    ...headings,
    { text: "END", startIndex: text.length, level: 0 },
  ];

  // Chunk each section separately
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headingsWithEnd[i + 1];

    const sectionText = text.substring(heading.startIndex, nextHeading.startIndex);

    // Skip sections that are too small
    if (sectionText.trim().length < MIN_CHUNK_LENGTH) {
      continue;
    }

    // Use recursive splitter for this section
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: config.separators || ["\n\n", "\n", ". ", " ", ""],
    });

    const sectionDocs = await splitter.createDocuments([sectionText]);

    for (const doc of sectionDocs) {
      // Filter out chunks that are too small or just whitespace/numbers
      const cleanContent = doc.pageContent.trim();
      const meaningfulContent = cleanContent.replace(/[\d\s\.\,\-\(\)]+/g, "");

      if (cleanContent.length < MIN_CHUNK_LENGTH || meaningfulContent.length < 50) {
        continue; // Skip tiny or number-only chunks
      }

      // Detect content type based on structure
      const contentType = detectContentType(cleanContent);

      chunks.push({
        content: cleanContent,
        contentHash: await hashContent(cleanContent),
        chunkIndex: chunkIndex++,
        metadata: {
          position: chunkIndex,
          contentType,
        },
      });
    }
  }

  console.log(`Created ${chunks.length} valid chunks (filtered small/empty chunks)`);

  return { chunks };
}

function detectContentType(content: string): string {
  const lines = content.split("\n");

  // Check for table-like content (multiple columns, numbers aligned)
  const tabLines = lines.filter(
    (l) => l.includes("\t") || (l.match(/\s{3,}/g) || []).length >= 2
  );
  if (tabLines.length > lines.length * 0.3) {
    return "table";
  }

  // Check for list content (bullet points, numbered lists)
  const listLines = lines.filter((l) => /^\s*[\•\-\*\d]+[\.\)]\s/.test(l));
  if (listLines.length > lines.length * 0.3) {
    return "list";
  }

  // Check for financial data (lots of currency/percentages)
  const financialMatches = content.match(/\$[\d,]+|\d+%|\d+\.\d+/g) || [];
  if (financialMatches.length > 5) {
    return "financial-data";
  }

  return "text";
}
