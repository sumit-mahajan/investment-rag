/**
 * Data Transfer Objects
 */

import type { AnalysisDocumentRef } from "@/lib/db/schema";

export interface CreateAnalysisDTO {
  userId: string;
  documents: AnalysisDocumentRef[];
}

export interface AnalysisFiltersDTO {
  /** Reserved for future filters */
  status?: string;
}
