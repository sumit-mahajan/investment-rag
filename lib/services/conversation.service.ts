import { injectable } from "tsyringe";
import { ConversationRepository } from "@/lib/repositories/conversation.repository";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import type { ConversationMessage } from "@/lib/db/schema";
import type { Conversation } from "@/lib/types/domain-models";
import type { InvestmentAnalysis } from "@/lib/types/analysis";
import { NotFoundError, ValidationError } from "@/lib/errors/domain-errors";
import { generateFollowUpAnswer } from "@/lib/agents/follow-up-answer";
import { retrieveChunks } from "@/lib/retrieval";

function isInvestmentAnalysis(value: unknown): value is InvestmentAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as InvestmentAnalysis;
  return v.verdict != null && Array.isArray(v.keyMetrics);
}

@injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly analysisRepo: AnalysisRepository
  ) {}

  async getConversation(
    userId: string,
    analysisId: string
  ): Promise<Conversation | null> {
    return this.conversationRepo.findByAnalysisId(analysisId, userId);
  }

  async sendMessage(
    userId: string,
    analysisId: string,
    content: string
  ): Promise<Conversation> {
    const trimmed = content?.trim();
    if (!trimmed) throw new ValidationError("Message cannot be empty");

    const analysis = await this.analysisRepo.findByIdAndUserId(analysisId, userId);
    if (!analysis) throw new NotFoundError("Analysis", analysisId);
    if (!analysis.result || !isInvestmentAnalysis(analysis.result)) {
      throw new ValidationError(
        "Follow-up chat is available after the investment analysis completes"
      );
    }

    let conversation = await this.conversationRepo.findByAnalysisId(
      analysisId,
      userId
    );
    if (!conversation) {
      conversation = await this.conversationRepo.create(userId, analysisId);
    }

    const fileIds = analysis.documents.map((d) => d.fileId);
    const now = new Date().toISOString();

    const userMessage: ConversationMessage = {
      role: "user",
      content: trimmed,
      createdAt: now,
    };

    const chunks = await retrieveChunks({
      userId,
      fileIds,
      query: trimmed,
      topK: 8,
    });

    const answer = await generateFollowUpAnswer({
      question: trimmed,
      fileIds,
      userId,
      analysisResult: analysis.result,
      priorMessages: conversation.messages,
    });

    const assistantMessage: ConversationMessage = {
      role: "assistant",
      content: answer,
      createdAt: new Date().toISOString(),
    };

    return this.conversationRepo.appendMessages(conversation.id, [
      userMessage,
      assistantMessage,
    ]);
  }
}
