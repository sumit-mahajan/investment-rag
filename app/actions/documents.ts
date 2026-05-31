"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { UnauthorizedError } from "@/lib/errors/domain-errors";
import type { DeleteDocumentResult } from "./types";

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

