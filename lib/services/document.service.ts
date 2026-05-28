import { randomUUID } from "crypto";
import { injectable } from "tsyringe";
import { ingestDocument } from "@/lib/ingestion";
import type { FileRecord } from "@/lib/types/core";
import { NotFoundError } from "@/lib/errors/domain-errors";
import { listUserFiles, deleteVectorsByFileId } from "@/lib/vectorstore/operations";
import { del } from "@vercel/blob";

@injectable()
export class DocumentService {
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
    return listUserFiles(userId);
  }

  async getFile(userId: string, fileId: string): Promise<FileRecord> {
    const files = await listUserFiles(userId);
    const file = files.find((f) => f.fileId === fileId);
    if (!file) throw new NotFoundError("Document", fileId);
    return file;
  }

  async deleteFile(userId: string, fileId: string, blobUrl?: string): Promise<void> {
    const files = await listUserFiles(userId);
    const file = files.find((f) => f.fileId === fileId);
    if (!file) throw new NotFoundError("Document", fileId);

    await deleteVectorsByFileId(userId, fileId);

    const url = blobUrl ?? file.blobUrl;
    if (url) {
      del(url).catch((err) => console.error("Failed to delete blob:", err));
    }
  }

  async fileExists(userId: string, fileId: string): Promise<boolean> {
    const files = await listUserFiles(userId);
    return files.some((f) => f.fileId === fileId);
  }
}
