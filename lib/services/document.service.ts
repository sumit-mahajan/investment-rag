import { randomUUID } from "crypto";
import { injectable } from "tsyringe";
import { ingestDocument } from "@/lib/ingestion";
import type { FileRecord } from "@/lib/types/core";
import { NotFoundError } from "@/lib/errors/domain-errors";
import { deleteVectorsByFileId } from "@/lib/vectorstore/operations";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { del } from "@vercel/blob";

export type StartIngestionResult = {
  fileId: string;
  fileName: string;
  blobUrl: string;
  status: "processing";
};

@injectable()
export class DocumentService {
  constructor(private readonly documentRepo: DocumentRepository) {}

  /** Creates a processing row and returns immediately; call executeIngestion via after(). */
  async startIngestion(
    userId: string,
    data: { blobUrl: string; filename: string }
  ): Promise<StartIngestionResult> {
    const fileId = randomUUID();
    const fileName = data.filename;

    await this.documentRepo.create({
      fileId,
      userId,
      fileName,
      blobUrl: data.blobUrl,
      status: "processing",
      chunkCount: 0,
    });

    console.log(`[ingest] queued fileId=${fileId} fileName=${fileName}`);

    return {
      fileId,
      fileName,
      blobUrl: data.blobUrl,
      status: "processing",
    };
  }

  /** LlamaParse → chunk → embed → Pinecone; updates registry row. Run in after() on Vercel. */
  async executeIngestion(fileId: string, userId: string): Promise<void> {
    const file = await this.documentRepo.findByIdAndUserId(fileId, userId);
    if (!file) {
      console.error(
        `executeIngestion: document ${fileId} not found for user ${userId} — skipping`
      );
      return;
    }

    if (file.status !== "processing") {
      console.log(
        `executeIngestion: document ${fileId} status=${file.status} — skipping`
      );
      return;
    }

    console.log(`[ingest] start fileId=${fileId} fileName=${file.fileName}`);

    try {
      const fileResponse = await fetch(file.blobUrl);
      if (!fileResponse.ok) {
        throw new Error("Failed to fetch uploaded file from blob storage");
      }

      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

      const chunkCount = await ingestDocument({
        fileId,
        userId,
        fileName: file.fileName,
        blobUrl: file.blobUrl,
        fileBuffer,
      });

      await this.documentRepo.updateIngestResult(fileId, userId, {
        status: "completed",
        chunkCount,
      });

      console.log(`[ingest] done fileId=${fileId} chunks=${chunkCount}`);
    } catch (error) {
      console.error(`[ingest] failed fileId=${fileId}:`, error);
      try {
        await deleteVectorsByFileId(userId, fileId);
      } catch (cleanupError) {
        console.error(`[ingest] vector cleanup failed fileId=${fileId}:`, cleanupError);
      }
      try {
        await this.documentRepo.updateIngestResult(fileId, userId, {
          status: "failed",
          chunkCount: 0,
        });
      } catch (persistError) {
        console.error(
          `Failed to persist failed ingest status for ${fileId}:`,
          persistError
        );
      }
    }
  }

  async listUserFiles(userId: string): Promise<FileRecord[]> {
    return this.documentRepo.findByUserId(userId);
  }

  async getFile(userId: string, fileId: string): Promise<FileRecord> {
    const file = await this.documentRepo.findByIdAndUserId(fileId, userId);
    if (!file) throw new NotFoundError("Document", fileId);
    return file;
  }

  async getFiles(userId: string, fileIds: string[]): Promise<FileRecord[]> {
    return this.documentRepo.findByIdsAndUserId(fileIds, userId);
  }

  async deleteFile(userId: string, fileId: string, blobUrl?: string): Promise<void> {
    const file = await this.documentRepo.findByIdAndUserId(fileId, userId);
    if (!file) throw new NotFoundError("Document", fileId);

    await deleteVectorsByFileId(userId, fileId);

    const url = blobUrl ?? file.blobUrl;
    if (url) {
      del(url).catch((err) => console.error("Failed to delete blob:", err));
    }

    await this.documentRepo.delete(fileId, userId);
  }

  async fileExists(userId: string, fileId: string): Promise<boolean> {
    return this.documentRepo.exists(fileId, userId);
  }
}
