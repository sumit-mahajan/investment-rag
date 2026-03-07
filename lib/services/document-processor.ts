import { injectable } from "tsyringe";
import { parsePDF } from "@/lib/parsers/pdf-parser";
import { extractCompanyInfoWithLLM } from "@/lib/parsers/company-info-extractor";
import { chunkDocument } from "@/lib/rag/chunking/strategies";
import { Embedder } from "@/lib/rag/embeddings/embedder";
import { upsertVectors } from "@/lib/vectorstore/operations";
import { ragConfig } from "@/config/rag.config";
import { extractMetadata } from "@/lib/rag/metadata/extractor";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { DocumentChunkRepository } from "@/lib/repositories/document-chunk.repository";
import type { CreateDocumentChunkDTO } from "@/lib/types/dtos";
import { ProcessingError } from "@/lib/errors/domain-errors";

export interface ProcessDocumentInput {
  documentId: string;
  userId: string;
  fileBuffer: Buffer;
}

/**
 * Service for document processing (parsing, chunking, embedding, indexing)
 */
@injectable()
export class DocumentProcessorService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly chunkRepo: DocumentChunkRepository
  ) {}

  async processDocument(input: ProcessDocumentInput): Promise<void> {
    const { documentId, userId, fileBuffer } = input;

    try {
      await this.documentRepo.updateStatus(documentId, { status: "processing" });

      const parsed = await parsePDF(fileBuffer);

      const currentDoc = await this.documentRepo.getMetadata(documentId);

      const needsCompanyInfo =
        currentDoc &&
        (!currentDoc.companyName || !currentDoc.tickerSymbol || !currentDoc.cik);

      if (needsCompanyInfo) {
        const companyInfo = await extractCompanyInfoWithLLM(parsed.text);
        await this.documentRepo.updateMetadata(documentId, {
          companyName: currentDoc!.companyName ?? companyInfo.companyName,
          cik: currentDoc!.cik ?? companyInfo.cik,
          tickerSymbol: currentDoc!.tickerSymbol ?? companyInfo.ticker,
        });
      }

      const chunked = await chunkDocument(
        {
          text: parsed.text,
          documentId,
        },
        ragConfig.chunking
      );

      console.log(`Document chunked into ${chunked.chunks.length} chunks`);

      const nonEmptyChunks = chunked.chunks.filter((c) => c.content.trim().length > 0);
      if (nonEmptyChunks.length === 0) {
        throw new Error("No valid text content to embed after chunking");
      }
      if (nonEmptyChunks.length < chunked.chunks.length) {
        console.log(`Filtered ${chunked.chunks.length - nonEmptyChunks.length} empty chunks`);
      }

      const embedder = new Embedder(ragConfig.embedding);
      const texts = nonEmptyChunks.map((c) => c.content);
      const embeddings = await embedder.embedBatch(texts);

      console.log(`Generated ${embeddings.length} embeddings with ${embeddings[0]?.length || 0} dimensions each`);

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

      const namespace = `${userId}_${documentId}`;
      const vectors = nonEmptyChunks.map((chunk, i) => {
        const metadata = extractMetadata(chunk.content);

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

      await upsertVectors(vectors, namespace);

      console.log(`Upserted ${vectors.length} vectors to Pinecone`);

      const chunkRecords: CreateDocumentChunkDTO[] = nonEmptyChunks.map((chunk, i) => {
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

      await this.chunkRepo.createBatch(chunkRecords);

      await this.documentRepo.updateProcessingResult(documentId, {
        status: "completed",
        totalChunks: nonEmptyChunks.length,
        processedAt: new Date(),
        isImageBased: parsed.isImageBased,
      });

      console.log(`Document processing completed for ${documentId}`);
    } catch (error) {
      console.error("Error processing document:", error);

      await this.documentRepo.updateProcessingResult(documentId, {
        status: "failed",
        processingError: error instanceof Error ? error.message : "Unknown error",
      });

      throw new ProcessingError(
        `Document processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

/** Convenience function for scripts/callers that prefer function over DI */
export async function processDocument(input: ProcessDocumentInput): Promise<void> {
  const { container } = await import("@/lib/di");
  const processor = container.resolve(DocumentProcessorService);
  return processor.processDocument(input);
}
