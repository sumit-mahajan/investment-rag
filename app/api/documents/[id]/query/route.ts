import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { handleError } from "@/lib/utils/errors";
import { QueryRequestSchema } from "@/lib/utils/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify document exists and belongs to user
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status !== "completed") {
      return NextResponse.json(
        { error: "Document processing not completed" },
        { status: 400 }
      );
    }

    // Retrieve relevant chunks
    const results = await retrieveRelevantChunks({
      documentId,
      userId,
      query: validated.query,
      topK: validated.topK,
      useExpansion: false,
      useReranking: true,
      useDiversity: true,
    });

    return NextResponse.json({
      query: validated.query,
      results: results.map((r) => ({
        content: r.content,
        score: r.combinedScore,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    console.error("Query error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
