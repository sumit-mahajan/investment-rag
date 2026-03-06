/**
 * Metrics and monitoring service
 */

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

class MetricsService {
  private metrics: Metric[] = [];

  track(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });

    // In production, send to monitoring service (DataDog, New Relic, etc.)
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring({ name, value, tags });
    }
  }

  // Track document processing time
  trackDocumentProcessing(documentId: string, durationMs: number) {
    this.track("document.processing.duration", durationMs, {
      documentId,
    });
  }

  // Track embedding generation
  trackEmbeddingGeneration(count: number, durationMs: number) {
    this.track("embedding.generation.count", count);
    this.track("embedding.generation.duration", durationMs);
  }

  // Track analysis duration
  trackAnalysis(analysisId: string, durationMs: number, criteriaCount: number) {
    this.track("analysis.duration", durationMs, {
      analysisId,
      criteriaCount: criteriaCount.toString(),
    });
  }

  // Track retrieval metrics
  trackRetrieval(chunksRetrieved: number, durationMs: number) {
    this.track("retrieval.chunks", chunksRetrieved);
    this.track("retrieval.duration", durationMs);
  }

  // Track costs
  trackCost(operation: string, costUsd: number) {
    this.track("cost.usd", costUsd, { operation });
  }

  private sendToMonitoring(metric: Omit<Metric, "timestamp">) {
    // Implement integration with monitoring service
    // Example: DataDog, New Relic, CloudWatch, etc.
    console.log("Metric:", metric);
  }

  // Get recent metrics (for debugging)
  getRecentMetrics(limit: number = 100): Metric[] {
    return this.metrics.slice(-limit);
  }

  // Clear metrics (for testing)
  clear() {
    this.metrics = [];
  }
}

export const metricsService = new MetricsService();
