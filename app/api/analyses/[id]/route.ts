import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { analyses, analysisCriteria } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { handleError } from "@/lib/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [analysis] = await db
      .select()
      .from(analyses)
      .where(and(eq(analyses.id, id), eq(analyses.userId, userId)));

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Get criteria
    const criteria = await db
      .select()
      .from(analysisCriteria)
      .where(eq(analysisCriteria.analysisId, id));

    return NextResponse.json({
      ...analysis,
      criteria,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
