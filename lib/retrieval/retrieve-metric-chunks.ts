import { retrieveChunks, dedupeChunks } from "./retrieve-chunks";
import type { RetrievedChunk } from "@/lib/types/core";

export interface MetricRetrievalSpec {
  query: string;
  supplementalQueries?: string[];
}

/**
 * Retrieve chunks for metric extraction — merges supplemental queries and
 * prioritizes table chunks (where 10-K financials usually live).
 */
export async function retrieveMetricChunks(
  userId: string,
  fileIds: string[],
  spec: MetricRetrievalSpec,
  topKPerQuery = 8
): Promise<RetrievedChunk[]> {
  const queries = [spec.query, ...(spec.supplementalQueries ?? [])];
  const all: RetrievedChunk[] = [];

  for (const query of queries) {
    const chunks = await retrieveChunks({
      userId,
      fileIds,
      query,
      topK: topKPerQuery,
    });
    all.push(...chunks);
  }

  const deduped = dedupeChunks(all);

  return deduped.sort((a, b) => {
    const aTable = a.chunkType === "table" ? 1 : 0;
    const bTable = b.chunkType === "table" ? 1 : 0;
    if (bTable !== aTable) return bTable - aTable;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}
