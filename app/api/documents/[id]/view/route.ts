import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { handleError } from "@/lib/utils/errors";

export const runtime = "nodejs";

/**
 * Redirects to the PDF on Vercel Blob, optionally scrolled to a page (#page=N).
 * Auth ensures users only open their own documents.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const page = req.nextUrl.searchParams.get("page");
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;

    const documentService = container.resolve(DocumentService);
    const file = await documentService.getFile(userId, fileId);

    if (!file.blobUrl) {
      return NextResponse.json({ error: "Document URL not found" }, { status: 404 });
    }

    const target = `${file.blobUrl}#page=${pageNum}`;
    return NextResponse.redirect(target, 302);
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
