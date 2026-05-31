import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
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

    const file = await documentService.startIngestion(userId, {
      blobUrl,
      filename,
    });

    after(async () => {
      try {
        await documentService.executeIngestion(file.fileId, userId);
      } catch (error) {
        console.error("Document ingestion failed:", error);
      } finally {
        try {
          revalidatePath("/dashboard");
        } catch {
          // revalidatePath requires an active Next.js request context
        }
      }
    });

    return NextResponse.json({
      fileId: file.fileId,
      fileName: file.fileName,
      blobUrl: file.blobUrl,
      status: file.status,
      chunkCount: 0,
      message: "Document queued for indexing. It will appear when processing completes.",
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
