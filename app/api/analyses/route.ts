import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { analyses, documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { handleError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAnalyses = await db
      .select({
        id: analyses.id,
        documentId: analyses.documentId,
        status: analyses.status,
        verdict: analyses.verdict,
        confidenceScore: analyses.confidenceScore,
        summary: analyses.summary,
        createdAt: analyses.createdAt,
        completedAt: analyses.completedAt,
        documentName: documents.originalName,
        companyName: documents.companyName,
      })
      .from(analyses)
      .innerJoin(documents, eq(analyses.documentId, documents.id))
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));

    return NextResponse.json(userAnalyses);
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
