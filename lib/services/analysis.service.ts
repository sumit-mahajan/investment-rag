import { injectable } from "tsyringe";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { runFinancialAnalysis } from "@/lib/agents/financial-analyzer";
import { listUserFiles } from "@/lib/vectorstore/operations";
import type { AnalysisFiltersDTO } from "@/lib/types/dtos";
import type { Analysis } from "@/lib/types/domain-models";
import { DEFAULT_ANALYSIS_QUESTION } from "@/lib/agents/constants";
import { NotFoundError, ValidationError, ProcessingError } from "@/lib/errors/domain-errors";

@injectable()
export class AnalysisService {
  constructor(private readonly analysisRepo: AnalysisRepository) {}

  async startAnalysis(
    userId: string,
    fileIds: string[],
    question: string
  ): Promise<Analysis> {
    if (fileIds.length === 0) {
      throw new ValidationError("At least one document must be provided");
    }
    const resolvedQuestion = question?.trim() || DEFAULT_ANALYSIS_QUESTION;

    const userFiles = await listUserFiles(userId);
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

    const analysis = await this.analysisRepo.create({ userId, documents });

    this.runInBackground(analysis.id, fileIds, userId, resolvedQuestion).catch((err) => {
      console.error("Analysis background error:", err);
    });

    return analysis;
  }

  async listUserAnalyses(
    userId: string,
    filters?: AnalysisFiltersDTO
  ): Promise<Analysis[]> {
    return this.analysisRepo.findByUserId(userId, filters);
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

  private async runInBackground(
    analysisId: string,
    fileIds: string[],
    userId: string,
    question: string
  ): Promise<void> {
    try {
      const { analysis, traceUrl } = await runFinancialAnalysis(
        fileIds,
        userId,
        question
      );
      await this.analysisRepo.updateResult(analysisId, { result: analysis, traceUrl });
    } catch (error) {
      await this.analysisRepo.updateResult(analysisId, {
        result: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw new ProcessingError(
        `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
