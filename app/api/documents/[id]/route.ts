import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { handleError } from "@/lib/utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const documentService = container.resolve(DocumentService);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const file = await documentService.getFile(userId, fileId);

    return NextResponse.json({
      id: file.fileId,
      fileId: file.fileId,
      originalName: file.fileName,
      fileName: file.fileName,
      blobUrl: file.blobUrl,
      status: file.status,
      totalChunks: file.chunkCount ?? 0,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const documentService = container.resolve(DocumentService);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const body = await req.json().catch(() => ({}));
    const blobUrl = typeof body?.blobUrl === "string" ? body.blobUrl : undefined;

    await documentService.deleteFile(userId, fileId, blobUrl);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
