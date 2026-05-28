import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { handleError } from "@/lib/utils/errors";

export async function GET() {
  const documentService = container.resolve(DocumentService);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await documentService.listUserFiles(userId);

    return NextResponse.json({
      documents: files.map((f) => ({
        id: f.fileId,
        fileId: f.fileId,
        originalName: f.fileName,
        fileName: f.fileName,
        blobUrl: f.blobUrl,
        status: f.status,
        totalChunks: f.chunkCount ?? 0,
      })),
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
