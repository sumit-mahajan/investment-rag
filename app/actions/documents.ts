"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { UnauthorizedError } from "@/lib/errors/domain-errors";
import type { DeleteDocumentResult, RegisterDocumentResult } from "./types";

export async function deleteDocumentAction(
  fileId: string,
  blobUrl?: string
): Promise<DeleteDocumentResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError("Authentication required");

    const documentService = container.resolve(DocumentService);
    await documentService.deleteFile(userId, fileId, blobUrl);

    revalidatePath("/dashboard");
    revalidatePath("/analyses");

    return {
      success: true,
      data: { message: "Document deleted successfully" },
    };
  } catch (error) {
    console.error("Delete document error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

export async function registerDocumentAction(
  blobUrl: string,
  filename: string
): Promise<RegisterDocumentResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError("Authentication required");

    const response = await fetch(blobUrl);
    if (!response.ok) throw new Error("Failed to fetch uploaded file");

    const fileBuffer = Buffer.from(await response.arrayBuffer());

    const documentService = container.resolve(DocumentService);
    const file = await documentService.registerFile(userId, {
      blobUrl,
      filename,
      fileBuffer,
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { documentId: file.fileId, fileId: file.fileId },
    };
  } catch (error) {
    console.error("Register document error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register document",
    };
  }
}
