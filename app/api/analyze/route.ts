import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { documents, analyses, analysisCriteria } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { runFinancialAnalysis } from "@/lib/agents/financial-analyzer";
import { analysisCriteria as criteriaConfig } from "@/config/criteria.config";
import { handleError } from "@/lib/utils/errors";
import { AnalysisRequestSchema } from "@/lib/utils/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = AnalysisRequestSchema.parse(body);

    // Verify document exists and belongs to user
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, validated.documentId),
          eq(documents.userId, userId)
        )
      );

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status !== "completed") {
      return NextResponse.json(
        { error: "Document processing not completed" },
        { status: 400 }
      );
    }

    // Get criteria
    const criteria = validated.criteriaIds.map((id) => criteriaConfig[id]).filter(Boolean);

    if (criteria.length === 0) {
      return NextResponse.json(
        { error: "No valid criteria provided" },
        { status: 400 }
      );
    }

    // Create analysis record
    const [analysis] = await db
      .insert(analyses)
      .values({
        documentId: validated.documentId,
        userId,
        status: "running",
      })
      .returning();

    // Run analysis asynchronously
    runAnalysis(analysis.id, validated.documentId, userId, criteria).catch(
      (error) => {
        console.error("Analysis error:", error);
      }
    );

    return NextResponse.json({
      analysisId: analysis.id,
      status: analysis.status,
      message: "Analysis started",
    });
  } catch (error) {
    console.error("Analysis request error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}

async function runAnalysis(
  analysisId: string,
  documentId: string,
  userId: string,
  criteria: any[]
) {
  try {
    console.log(`Starting analysis ${analysisId}`);

    // Run the LangGraph agent
    const result = await runFinancialAnalysis(documentId, userId, criteria);

    console.log(`Analysis completed with verdict: ${result.verdict}`);

    // Store criteria results
    const criteriaRecords = result.analyses.map((a) => ({
      analysisId,
      criterionId: a.criterionId,
      criterionName: a.criterionName,
      score: a.score.toString(),
      findings: a.findings,
      evidence: a.evidence as any,
    }));

    await db.insert(analysisCriteria).values(criteriaRecords);

    // Update analysis record
    await db
      .update(analyses)
      .set({
        status: "completed",
        verdict: result.verdict,
        confidenceScore: result.confidenceScore?.toString(),
        summary: result.summary,
        results: result.analyses as any,
        sources: result.sources as any,
        completedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));

    console.log(`Analysis ${analysisId} stored successfully`);
  } catch (error) {
    console.error(`Analysis ${analysisId} failed:`, error);

    await db
      .update(analyses)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(analyses.id, analysisId));
  }
}
