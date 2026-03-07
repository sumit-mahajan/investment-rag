import { injectable } from "tsyringe";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { AnalysisCriteriaRepository } from "@/lib/repositories/analysis-criteria.repository";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { runFinancialAnalysis } from "@/lib/agents/financial-analyzer";
import { withTransaction } from "@/lib/repositories/base.repository";
import type {
  CreateAnalysisDTO,
  CreateAnalysisCriterionDTO,
  AnalysisFiltersDTO,
} from "@/lib/types/dtos";
import type { Analysis, AnalysisCriterion } from "@/lib/types/domain-models";
import {
  NotFoundError,
  ValidationError,
  ProcessingError,
} from "@/lib/errors/domain-errors";

/**
 * Service for analysis operations
 */
@injectable()
export class AnalysisService {
  constructor(
    private readonly analysisRepo: AnalysisRepository,
    private readonly criteriaRepo: AnalysisCriteriaRepository,
    private readonly documentRepo: DocumentRepository
  ) {}

  /**
   * Start a new financial analysis
   */
  async startAnalysis(
    userId: string,
    documentId: string,
    criteriaIds: string[],
    criteriaConfig: Record<string, any>
  ): Promise<Analysis> {
    // Verify document exists and belongs to user
    const document = await this.documentRepo.findByIdAndUserId(
      documentId,
      userId
    );

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    if (document.status !== "completed") {
      throw new ValidationError("Document processing not completed");
    }

    // Get criteria from config
    const criteria = criteriaIds
      .map((id) => criteriaConfig[id])
      .filter(Boolean);

    if (criteria.length === 0) {
      throw new ValidationError("No valid criteria provided");
    }

    // Create analysis record
    const analysisData: CreateAnalysisDTO = {
      documentId,
      userId,
      status: "running",
    };

    const analysis = await this.analysisRepo.create(analysisData);

    // Run analysis asynchronously (don't await)
    this.runAnalysisInBackground(
      analysis.id,
      documentId,
      userId,
      criteria
    ).catch((error) => {
      console.error("Analysis error:", error);
    });

    return analysis;
  }

  /**
   * Get all analyses for a user
   */
  async listUserAnalyses(
    userId: string,
    filters?: AnalysisFiltersDTO
  ): Promise<any[]> {
    const analyses = await this.analysisRepo.findByUserId(userId, filters);

    return analyses.map((analysis) => ({
      id: analysis.id,
      documentId: analysis.documentId,
      status: analysis.status,
      verdict: analysis.verdict,
      confidenceScore: analysis.confidenceScore,
      summary: analysis.summary,
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt,
      documentName: analysis.document.originalName,
      companyName: analysis.document.companyName,
    }));
  }

  /**
   * Get a single analysis with criteria
   */
  async getAnalysis(
    userId: string,
    analysisId: string
  ): Promise<Analysis & { criteria: AnalysisCriterion[] }> {
    const analysis = await this.analysisRepo.findByIdAndUserId(
      analysisId,
      userId
    );

    if (!analysis) {
      throw new NotFoundError("Analysis", analysisId);
    }

    const criteria = await this.criteriaRepo.findByAnalysisId(analysisId);

    return {
      ...analysis,
      criteria,
    };
  }

  /**
   * Get analyses for a specific document
   */
  async getDocumentAnalyses(documentId: string): Promise<Analysis[]> {
    return await this.analysisRepo.findByDocumentId(documentId);
  }

  /**
   * Delete an analysis
   */
  async deleteAnalysis(userId: string, analysisId: string): Promise<void> {
    const analysis = await this.analysisRepo.findByIdAndUserId(
      analysisId,
      userId
    );

    if (!analysis) {
      throw new NotFoundError("Analysis", analysisId);
    }

    await withTransaction(async (tx) => {
      await this.criteriaRepo.deleteByAnalysisId(analysisId, tx);
      await this.analysisRepo.delete(analysisId, tx);
    });
  }

  /**
   * Get analysis count for a user
   */
  async getAnalysisCount(userId: string): Promise<number> {
    return await this.analysisRepo.countByUserId(userId);
  }

  /**
   * Run analysis in background
   */
  private async runAnalysisInBackground(
    analysisId: string,
    documentId: string,
    userId: string,
    criteria: any[]
  ): Promise<void> {
    try {
      console.log(`Starting analysis ${analysisId}`);

      // Run the LangGraph agent
      const result = await runFinancialAnalysis(documentId, userId, criteria);

      console.log(`Analysis completed with verdict: ${result.verdict}`);

      // Store criteria results and update analysis in a transaction
      await withTransaction(async (tx) => {
        // Store criteria results
        const criteriaRecords: CreateAnalysisCriterionDTO[] = result.analyses.map(
          (a) => ({
            analysisId,
            criterionId: a.criterionId,
            criterionName: a.criterionName,
            score: a.score.toString(),
            findings: a.findings,
            evidence: a.evidence as any,
          })
        );

        await this.criteriaRepo.createBatch(criteriaRecords, tx);

        // Store results: criteria + philosophies (value & growth investing)
        const resultsPayload = {
          criteria: result.analyses,
          philosophies: result.philosophyAnalyses ?? [],
        };

        // Update analysis record
        await this.analysisRepo.updateResults(
          analysisId,
          {
            status: "completed",
            verdict: result.verdict,
            confidenceScore: result.confidenceScore?.toString(),
            summary: result.summary,
            results: resultsPayload as any,
            sources: result.sources as any,
            completedAt: new Date(),
          },
          tx
        );
      });

      console.log(`Analysis ${analysisId} stored successfully`);
    } catch (error) {
      console.error(`Analysis ${analysisId} failed:`, error);

      await this.analysisRepo.updateStatus(analysisId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new ProcessingError(
        `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
