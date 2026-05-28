import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { handleError } from "@/lib/utils/errors";

export const runtime = "nodejs";
/** LlamaParse + embed + Pinecone can take several minutes on large PDFs */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const documentService = container.resolve(DocumentService);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { blobUrl, filename } = body;

    if (!blobUrl || !filename) {
      return NextResponse.json(
        { error: "Missing required fields: blobUrl, filename" },
        { status: 400 }
      );
    }

    const fileResponse = await fetch(blobUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    const file = await documentService.registerFile(userId, {
      blobUrl,
      filename,
      fileBuffer,
    });

    return NextResponse.json({
      fileId: file.fileId,
      fileName: file.fileName,
      blobUrl: file.blobUrl,
      status: file.status,
      chunkCount: file.chunkCount,
      message: "Document indexed and ready for analysis.",
    });
  } catch (error) {
    console.error("Register error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
