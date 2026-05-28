import type { RetrievedChunk } from "@/lib/types/core";
import type { ExtractedMetric } from "@/lib/types/analysis";
import type { SourceDocument } from "@/lib/types/analysis";

function addPages(map: Map<string, SourceDocument>, chunk: RetrievedChunk, section: string) {
  const key = chunk.fileId;
  const existing = map.get(key);
  if (existing) {
    if (!existing.pages.includes(chunk.pageNumber)) {
      existing.pages.push(chunk.pageNumber);
      existing.pages.sort((a, b) => a - b);
    }
    if (!existing.usedInSections.includes(section)) {
      existing.usedInSections.push(section);
    }
    return;
  }
  map.set(key, {
    fileId: chunk.fileId,
    fileName: chunk.fileName,
    blobUrl: chunk.blobUrl,
    pages: [chunk.pageNumber],
    usedInSections: [section],
  });
}

/** Aggregate unique source documents/pages used across the analysis pipeline */
export function buildSourcesUsed(
  extractedMetrics: ExtractedMetric[],
  qualitativeChunks: RetrievedChunk[]
): SourceDocument[] {
  const map = new Map<string, SourceDocument>();

  for (const metric of extractedMetrics) {
    for (const chunk of metric.chunks) {
      addPages(map, chunk, "metrics");
    }
  }

  for (const chunk of qualitativeChunks) {
    addPages(map, chunk, "qualitative");
  }

  return Array.from(map.values()).sort((a, b) =>
    a.fileName.localeCompare(b.fileName)
  );
}
