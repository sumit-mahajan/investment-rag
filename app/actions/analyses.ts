"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { analysisCriteria as criteriaConfig } from "@/config/criteria.config";
import { UnauthorizedError } from "@/lib/errors/domain-errors";
import type { ActionResult } from "./types";

export type StartAnalysisResult = ActionResult<{ analysisId: string }>;

/**
 * Start a financial analysis on a document
 * @param documentId - The ID of the document to analyze
 * @param criteriaIds - Array of criteria IDs to evaluate
 * @returns Result with analysis ID or error
 */
export async function startAnalysisAction(
  documentId: string,
  criteriaIds: string[]
): Promise<StartAnalysisResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!criteriaIds || criteriaIds.length === 0) {
      return {
        success: false,
        error: "At least one criterion must be selected",
      };
    }

    if (criteriaIds.length > 10) {
      return {
        success: false,
        error: "Maximum 10 criteria allowed",
      };
    }

    const analysisService = container.resolve(AnalysisService);
    const analysis = await analysisService.startAnalysis(
      userId,
      documentId,
      criteriaIds,
      criteriaConfig
    );

    revalidatePath("/analyses");
    revalidatePath(`/analyses/${analysis.id}`);

    return {
      success: true,
      data: { analysisId: analysis.id },
    };
  } catch (error) {
    console.error("Start analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start analysis",
    };
  }
}
