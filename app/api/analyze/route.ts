import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { analysisCriteria as criteriaConfig } from "@/config/criteria.config";
import { handleError } from "@/lib/utils/errors";
import { AnalysisRequestSchema } from "@/lib/utils/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const analysisService = container.resolve(AnalysisService);

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = AnalysisRequestSchema.parse(body);

    // Start analysis
    const analysis = await analysisService.startAnalysis(
      userId,
      validated.documentId,
      validated.criteriaIds,
      criteriaConfig
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
