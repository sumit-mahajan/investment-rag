import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { handleError } from "@/lib/utils/errors";

export async function GET() {
  const analysisService = container.resolve(AnalysisService);
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAnalyses = await analysisService.listUserAnalyses(userId);

    return NextResponse.json(userAnalyses);
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
