import { randomUUID } from "crypto";
import { injectable } from "tsyringe";
import { ingestDocument } from "@/lib/ingestion";
import type { FileRecord } from "@/lib/types/core";
import { NotFoundError } from "@/lib/errors/domain-errors";
import { deleteVectorsByFileId } from "@/lib/vectorstore/operations";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { del } from "@vercel/blob";

@injectable()
export class DocumentService {
  constructor(private readonly documentRepo: DocumentRepository) {}

  async registerFile(
    userId: string,
    data: {
      blobUrl: string;
      filename: string;
      fileBuffer: Buffer;
    }
  ): Promise<{
    fileId: string;
    fileName: string;
    blobUrl: string;
    status: "completed";
    chunkCount: number;
  }> {
    const fileId = randomUUID();
    const fileName = data.filename;

    console.log(`[ingest] start fileId=${fileId} fileName=${fileName}`);

    const chunkCount = await ingestDocument({
      fileId,
      userId,
      fileName,
      blobUrl: data.blobUrl,
      fileBuffer: data.fileBuffer,
    });

    await this.documentRepo.create({
      fileId,
      userId,
      fileName,
      blobUrl: data.blobUrl,
      status: "completed",
      chunkCount,
    });

    console.log(`[ingest] done fileId=${fileId} chunks=${chunkCount}`);

    return {
      fileId,
      fileName,
      blobUrl: data.blobUrl,
      status: "completed",
      chunkCount,
    };
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
