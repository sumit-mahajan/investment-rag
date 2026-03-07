import { injectable } from "tsyringe";
import { eq, and, inArray } from "drizzle-orm";
import { analysisCriteria } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { CreateAnalysisCriterionDTO } from "@/lib/types/dtos";
import type { AnalysisCriterion } from "@/lib/types/domain-models";

/**
 * Repository for analysis criteria operations
 */
@injectable()
export class AnalysisCriteriaRepository extends BaseRepository {
  /**
   * Create a single analysis criterion
   */
  async create(
    data: CreateAnalysisCriterionDTO,
    tx?: Transaction
  ): Promise<AnalysisCriterion> {
    return this.execute("Create analysis criterion", async () => {
      const client = this.getClient(tx);
      const [criterion] = await client
        .insert(analysisCriteria)
        .values({
          analysisId: data.analysisId,
          criterionId: data.criterionId,
          criterionName: data.criterionName,
          score: data.score,
          findings: data.findings,
          evidence: data.evidence,
          createdAt: new Date(),
        })
        .returning();

      return criterion;
    });
  }

  /**
   * Create multiple analysis criteria in batch
   */
  async createBatch(
    criteria: CreateAnalysisCriterionDTO[],
    tx?: Transaction
  ): Promise<AnalysisCriterion[]> {
    return this.execute("Create analysis criteria batch", async () => {
      if (criteria.length === 0) {
        return [];
      }

      const client = this.getClient(tx);
      const values = criteria.map((criterion) => ({
        analysisId: criterion.analysisId,
        criterionId: criterion.criterionId,
        criterionName: criterion.criterionName,
        score: criterion.score,
        findings: criterion.findings,
        evidence: criterion.evidence,
        createdAt: new Date(),
      }));

      const createdCriteria = await client
        .insert(analysisCriteria)
        .values(values)
        .returning();

      return createdCriteria;
    });
  }

  /**
   * Find all criteria for an analysis
   */
  async findByAnalysisId(
    analysisId: string,
    tx?: Transaction
  ): Promise<AnalysisCriterion[]> {
    return this.execute("Find criteria by analysis ID", async () => {
      const client = this.getClient(tx);
      const criteria = await client
        .select()
        .from(analysisCriteria)
        .where(eq(analysisCriteria.analysisId, analysisId));

      return criteria;
    });
  }

  /**
   * Find a criterion by ID
   */
  async findById(
    id: string,
    tx?: Transaction
  ): Promise<AnalysisCriterion | null> {
    return this.execute("Find criterion by ID", async () => {
      const client = this.getClient(tx);
      const [criterion] = await client
        .select()
        .from(analysisCriteria)
        .where(eq(analysisCriteria.id, id))
        .limit(1);

      return criterion || null;
    });
  }

  /**
   * Find criterion by analysis ID and criterion ID
   */
  async findByAnalysisAndCriterionId(
    analysisId: string,
    criterionId: string,
    tx?: Transaction
  ): Promise<AnalysisCriterion | null> {
    return this.execute("Find criterion by analysis and criterion ID", async () => {
      const client = this.getClient(tx);
      const [criterion] = await client
        .select()
        .from(analysisCriteria)
        .where(
          and(
            eq(analysisCriteria.analysisId, analysisId),
            eq(analysisCriteria.criterionId, criterionId)
          )
        )
        .limit(1);

      return criterion || null;
    });
  }

  /**
   * Delete all criteria for an analysis
   */
  async deleteByAnalysisId(analysisId: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete criteria by analysis ID", async () => {
      const client = this.getClient(tx);
      await client
        .delete(analysisCriteria)
        .where(eq(analysisCriteria.analysisId, analysisId));
    });
  }

  /**
   * Delete specific criteria by IDs
   */
  async deleteByIds(ids: string[], tx?: Transaction): Promise<void> {
    return this.execute("Delete criteria by IDs", async () => {
      if (ids.length === 0) {
        return;
      }

      const client = this.getClient(tx);
      await client
        .delete(analysisCriteria)
        .where(inArray(analysisCriteria.id, ids));
    });
  }
}
