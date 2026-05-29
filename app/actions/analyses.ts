"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { UnauthorizedError } from "@/lib/errors/domain-errors";
import type { ActionResult } from "./types";

export type StartAnalysisResult = ActionResult<{ analysisId: string }>;

export async function startAnalysisAction(
  documentIds: string[],
  question: string
): Promise<StartAnalysisResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError("Authentication required");

    if (!documentIds?.length) {
      return { success: false, error: "At least one document must be selected" };
    }
    const analysisService = container.resolve(AnalysisService);
    const resolvedQuestion = question?.trim() ?? "";
    const analysis = await analysisService.startAnalysis(
      userId,
      documentIds,
      resolvedQuestion
    );

    const runPipeline = async () => {
      try {
        await analysisService.executeAnalysis(
          analysis.id,
          userId,
          resolvedQuestion
        );
      } catch (error) {
        console.error("Analysis execution failed:", error);
      } finally {
        revalidatePath("/analyses");
        revalidatePath(`/analyses/${analysis.id}`);
      }
    };

    // Route handler + after() is reliable on Vercel; server actions can drop background work.
    after(runPipeline);

    revalidatePath("/analyses");
    revalidatePath(`/analyses/${analysis.id}`);

    return { success: true, data: { analysisId: analysis.id } };
  } catch (error) {
    console.error("Start analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start analysis",
    };
  }
}
