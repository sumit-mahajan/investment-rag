import { injectable } from "tsyringe";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { runFinancialAnalysis } from "@/lib/agents/financial-analyzer";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import type { AnalysisFiltersDTO } from "@/lib/types/dtos";
import type { Analysis } from "@/lib/types/domain-models";
import { DEFAULT_ANALYSIS_QUESTION } from "@/lib/agents/constants";
import { NotFoundError, ValidationError } from "@/lib/errors/domain-errors";

@injectable()
export class AnalysisService {
  constructor(
    private readonly analysisRepo: AnalysisRepository,
    private readonly documentRepo: DocumentRepository
  ) {}

  async startAnalysis(
    userId: string,
    fileIds: string[],
    question: string
  ): Promise<Analysis> {
    if (fileIds.length === 0) {
      throw new ValidationError("At least one document must be provided");
    }
    const resolvedQuestion = question?.trim() || DEFAULT_ANALYSIS_QUESTION;

    const userFiles = await this.documentRepo.findByIdsAndUserId(fileIds, userId);
    const fileMap = new Map(userFiles.map((f) => [f.fileId, f]));

    const documents = fileIds.map((fileId) => {
      const file = fileMap.get(fileId);
      if (!file) throw new NotFoundError("Document", fileId);
      if (file.status !== "completed") {
        throw new ValidationError(`File "${file.fileName}" is not ready for analysis`);
      }
      return {
        fileId: file.fileId,
        fileName: file.fileName,
        blobUrl: file.blobUrl,
      };
    });

    return this.analysisRepo.create({ userId, documents });
  }

  /** Run LangGraph pipeline and persist result. Call via `after()` on Vercel/serverless. */
  async executeAnalysis(
    analysisId: string,
    userId: string,
    question: string
  ): Promise<void> {
    const pending = await this.analysisRepo.findByIdAndUserId(analysisId, userId);
    if (!pending) {
      console.error(
        `executeAnalysis: analysis ${analysisId} not found for user ${userId} — skipping`
      );
      return;
    }

    const fileIds = pending.fileIds;
    const resolvedQuestion = question?.trim() || DEFAULT_ANALYSIS_QUESTION;

    try {
      const { analysis, traceUrl } = await runFinancialAnalysis(
        fileIds,
        userId,
        resolvedQuestion
      );
      await this.persistAnalysisResult(analysisId, { result: analysis, traceUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await this.persistAnalysisResult(analysisId, {
        result: { error: message },
      });
    }
  }

  /** Always persist terminal state so analyses do not stay stuck in "running". */
  private async persistAnalysisResult(
    analysisId: string,
    data: { result: unknown; traceUrl?: string }
  ): Promise<void> {
    try {
      await this.analysisRepo.updateResult(analysisId, data);
    } catch (persistError) {
      console.error(
        `Failed to persist analysis result for ${analysisId}:`,
        persistError
      );
    }
  }

  async listUserAnalyses(
    userId: string,
    filters?: AnalysisFiltersDTO
  ): Promise<Analysis[]> {
    return this.analysisRepo.findSummariesByUserId(userId, undefined, undefined);
  }

  async listRecentUserAnalyses(userId: string, limit: number): Promise<Analysis[]> {
    return this.analysisRepo.findSummariesByUserId(userId, limit);
  }

  async getAnalysis(userId: string, analysisId: string): Promise<Analysis> {
    const analysis = await this.analysisRepo.findByIdAndUserId(analysisId, userId);
    if (!analysis) throw new NotFoundError("Analysis", analysisId);
    return analysis;
  }

  async deleteAnalysis(userId: string, analysisId: string): Promise<void> {
    const analysis = await this.analysisRepo.findByIdAndUserId(analysisId, userId);
    if (!analysis) throw new NotFoundError("Analysis", analysisId);
    await this.analysisRepo.delete(analysisId);
  }

  async getAnalysisCount(userId: string): Promise<number> {
    return this.analysisRepo.countByUserId(userId);
  }
}
