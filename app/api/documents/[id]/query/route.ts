import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { handleError } from "@/lib/utils/errors";
import { QueryRequestSchema } from "@/lib/utils/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const documentService = container.resolve(DocumentService);

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await req.json();

    // Validate input
    const validated = QueryRequestSchema.parse({
      ...body,
      documentId,
    });

    // Query the document
    const result = await documentService.queryDocument(userId, documentId, {
      query: validated.query,
      topK: validated.topK,
      useReranking: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Query error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
