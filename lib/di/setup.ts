/**
 * DI container setup - registers all injectable dependencies.
 * Called from instrumentation.ts when the server starts.
 */
import "reflect-metadata";
import { container } from "tsyringe";
import { UserRepository } from "@/lib/repositories/user.repository";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { DocumentChunkRepository } from "@/lib/repositories/document-chunk.repository";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { AnalysisCriteriaRepository } from "@/lib/repositories/analysis-criteria.repository";
import { UserService } from "@/lib/services/user.service";
import { DocumentService } from "@/lib/services/document.service";
import { AnalysisService } from "@/lib/services/analysis.service";
import { DocumentProcessorService } from "@/lib/services/document-processor";

/**
 * Register all dependencies with the container.
 * Uses singleton scope for repositories and services.
 */
export function setupContainer(): void {
  // Repositories (singleton - stateless, share DB connection)
  container.registerSingleton(UserRepository);
  container.registerSingleton(DocumentRepository);
  container.registerSingleton(DocumentChunkRepository);
  container.registerSingleton(AnalysisRepository);
  container.registerSingleton(AnalysisCriteriaRepository);

  // Services (singleton)
  container.registerSingleton(UserService);
  container.registerSingleton(DocumentService);
  container.registerSingleton(AnalysisService);
  container.registerSingleton(DocumentProcessorService);
}

// Auto-run setup when this module is imported
setupContainer();
