"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { UnauthorizedError } from "@/lib/errors/domain-errors";
import type { DeleteDocumentResult, RegisterDocumentResult } from "./types";

/**
 * Delete a document and all associated resources
 * @param documentId - The ID of the document to delete
 * @returns Result indicating success or failure
 */
export async function deleteDocumentAction(
  documentId: string
): Promise<DeleteDocumentResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const documentService = container.resolve(DocumentService);
    await documentService.deleteDocument(userId, documentId);

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

/**
 * Register an uploaded document and start processing
 * @param blobUrl - The Vercel Blob URL of the uploaded file
 * @param filename - The original filename
 * @returns Result with document ID or error
 */
export async function registerDocumentAction(
  blobUrl: string,
  filename: string
): Promise<RegisterDocumentResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // Fetch the file from Vercel Blob
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch uploaded file");
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const documentService = container.resolve(DocumentService);
    const document = await documentService.registerDocument(userId, {
      blobUrl,
      filename,
      fileBuffer,
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { documentId: document.id },
    };
  } catch (error) {
    console.error("Register document error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register document",
    };
  }
}
