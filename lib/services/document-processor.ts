import { parsePDF } from "@/lib/parsers/pdf-parser";
import { extractCompanyInfoWithLLM } from "@/lib/parsers/company-info-extractor";
import { chunkDocument } from "@/lib/rag/chunking/strategies";
import { Embedder } from "@/lib/rag/embeddings/embedder";
import { upsertVectors } from "@/lib/vectorstore/operations";
import { ragConfig } from "@/config/rag.config";
import { db } from "@/lib/db/client";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractMetadata } from "@/lib/rag/metadata/extractor";

export interface ProcessDocumentInput {
  documentId: string;
  userId: string;
  fileBuffer: Buffer;
}

export async function processDocument(input: ProcessDocumentInput): Promise<void> {
  const { documentId, userId, fileBuffer } = input;

  try {
    // Update status to processing
    await db
      .update(documents)
      .set({ status: "processing" })
      .where(eq(documents.id, documentId));

    // Parse PDF
    const parsed = await parsePDF(fileBuffer);

    // Prefer upload metadata: only fill in company info when fields are missing
    const [currentDoc] = await db
      .select({
        companyName: documents.companyName,
        tickerSymbol: documents.tickerSymbol,
        cik: documents.cik,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    const needsCompanyInfo =
      currentDoc &&
      (!currentDoc.companyName || !currentDoc.tickerSymbol || !currentDoc.cik);

    if (needsCompanyInfo) {
      const companyInfo = await extractCompanyInfoWithLLM(parsed.text);
      await db
        .update(documents)
        .set({
          companyName: currentDoc!.companyName ?? companyInfo.companyName,
          cik: currentDoc!.cik ?? companyInfo.cik,
          tickerSymbol: currentDoc!.tickerSymbol ?? companyInfo.ticker,
        })
        .where(eq(documents.id, documentId));
    }

    // Chunk the document
    const chunked = await chunkDocument(
      {
        text: parsed.text,
        documentId,
      },
      ragConfig.chunking
    );

    console.log(`Document chunked into ${chunked.chunks.length} chunks`);

    // Filter out empty chunks (can cause embedding API to return empty vectors)
    const nonEmptyChunks = chunked.chunks.filter((c) => c.content.trim().length > 0);
    if (nonEmptyChunks.length === 0) {
      throw new Error("No valid text content to embed after chunking");
    }
    if (nonEmptyChunks.length < chunked.chunks.length) {
      console.log(`Filtered ${chunked.chunks.length - nonEmptyChunks.length} empty chunks`);
    }

    // Generate embeddings
    const embedder = new Embedder(ragConfig.embedding);
    const texts = nonEmptyChunks.map((c) => c.content);
    const embeddings = await embedder.embedBatch(texts);

    console.log(`Generated ${embeddings.length} embeddings with ${embeddings[0]?.length || 0} dimensions each`);

    // Validate: embedding API may return empty arrays on failure
    const emptyIndices = embeddings
      .map((emb, i) => (emb.length === 0 ? i : -1))
      .filter((i) => i >= 0);
    if (emptyIndices.length > 0) {
      throw new Error(
        `Embedding API returned empty vectors for ${emptyIndices.length} chunk(s). ` +
          `Check GOOGLE_API_KEY and embedding model "${ragConfig.embedding.model}". ` +
          `Try reducing embedding.batchSize in config (current: ${ragConfig.embedding.batchSize}).`
      );
    }

    // Prepare vectors for Pinecone
    const namespace = `${userId}_${documentId}`;
    const vectors = nonEmptyChunks.map((chunk, i) => {
      const metadata = extractMetadata(chunk.content);

      // Simplified metadata for Pinecone (only what's needed for filtering)
      const flatMetadata: Record<string, string | number | string[]> = {
        documentId,
        userId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        contentType: metadata.contentType,
        categories: metadata.categories,
      };

      return {
        id: `${documentId}_chunk_${i}`,
        values: embeddings[i],
        metadata: flatMetadata,
      };
    });

    // Upsert to Pinecone
    await upsertVectors(vectors, namespace);

    console.log(`Upserted ${vectors.length} vectors to Pinecone`);

    // Store chunks in database
    const chunkRecords = nonEmptyChunks.map((chunk, i) => {
      const metadata = extractMetadata(chunk.content);

      return {
        documentId,
        content: chunk.content,
        contentHash: chunk.contentHash,
        chunkIndex: chunk.chunkIndex,
        contentType: metadata.contentType,
        categories: metadata.categories,
        pineconeId: `${documentId}_chunk_${i}`,
        embeddingModel: ragConfig.embedding.model,
      };
    });

    await db.insert(documentChunks).values(chunkRecords);

    // Update document status
    await db
      .update(documents)
      .set({
        status: "completed",
        totalChunks: nonEmptyChunks.length,
        processedAt: new Date(),
        isImageBased: parsed.isImageBased,
      })
      .where(eq(documents.id, documentId));

    console.log(`Document processing completed for ${documentId}`);
  } catch (error) {
    console.error("Error processing document:", error);

    // Update status to failed
    await db
      .update(documents)
      .set({
        status: "failed",
        processingError: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(documents.id, documentId));

    throw error;
  }
}
