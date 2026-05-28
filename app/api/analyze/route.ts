import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
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
    const parsed = AnalysisRequestSchema.parse(body);
    const fileIds = parsed.fileIds ?? parsed.documentIds ?? [];

    const resolvedQuestion = parsed.question ?? "";
    const analysis = await analysisService.startAnalysis(
      userId,
      fileIds,
      resolvedQuestion
    );

    after(async () => {
      try {
        await analysisService.executeAnalysis(
          analysis.id,
          userId,
          resolvedQuestion
        );
      } catch (error) {
        console.error("Analysis execution failed:", error);
      }
    });

    return NextResponse.json({
      analysisId: analysis.id,
      status: analysis.status,
      message: "Analysis started",
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.statusCode });
  }
}
