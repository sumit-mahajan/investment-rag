/**
 * DI container setup — registers all injectable dependencies.
 */
import "reflect-metadata";
import { container } from "tsyringe";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { ConversationRepository } from "@/lib/repositories/conversation.repository";
import { DocumentService } from "@/lib/services/document.service";
import { AnalysisService } from "@/lib/services/analysis.service";
import { ConversationService } from "@/lib/services/conversation.service";

export function setupContainer(): void {
  container.registerSingleton(AnalysisRepository);
  container.registerSingleton(ConversationRepository);
  container.registerSingleton(DocumentService);
  container.registerSingleton(AnalysisService);
  container.registerSingleton(ConversationService);
}

setupContainer();
