"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  FileText,
  ExternalLink,
} from "lucide-react";
import type {
  Citation,
  InvestmentAnalysis,
  InvestmentRecommendation,
  SourceDocument,
} from "@/lib/types/analysis";
import type { AnalysisDocumentRef } from "@/lib/db/schema";

function isInvestmentAnalysis(value: unknown): value is InvestmentAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as InvestmentAnalysis;
  return (
    v.verdict != null &&
    typeof v.verdict.score === "number" &&
    Array.isArray(v.bullCase?.points) &&
    Array.isArray(v.bearCase?.points) &&
    Array.isArray(v.keyMetrics) &&
    Array.isArray(v.keyRisks?.points)
  );
}

const RECOMMENDATION_LABELS: Record<InvestmentRecommendation, string> = {
  strong_buy: "Strong Buy",
  buy: "Buy",
  hold: "Hold",
  caution: "Caution",
  avoid: "Avoid",
};

const RECOMMENDATION_STYLES: Record<InvestmentRecommendation, string> = {
  strong_buy: "bg-emerald-600 text-white",
  buy: "bg-emerald-100 text-emerald-800 border-emerald-300",
  hold: "bg-amber-100 text-amber-800 border-amber-300",
  caution: "bg-orange-100 text-orange-800 border-orange-300",
  avoid: "bg-rose-100 text-rose-800 border-rose-300",
};

function citationHref(
  citation: Citation,
  documents: AnalysisDocumentRef[]
): string | null {
  const fileId =
    citation.fileId ??
    documents.find((d) => d.fileName === citation.documentName)?.fileId;
  if (!fileId) return citation.blobUrl ? `${citation.blobUrl}#page=${citation.pageNumber}` : null;
  return `/api/documents/${fileId}/view?page=${citation.pageNumber}`;
}

interface AnalysisResultsProps {
  result: unknown;
  traceUrl?: string | null;
  documents?: AnalysisDocumentRef[];
}

function CitationBadge({
  citation,
  documents,
}: {
  citation: Citation;
  documents: AnalysisDocumentRef[];
}) {
  const href = citationHref(citation, documents);
  const label = `${citation.documentName} p.${citation.pageNumber}`;

  if (!href) {
    return (
      <Badge variant="outline" className="text-xs font-normal gap-1">
        <FileText className="w-3 h-3" />
        {label}
      </Badge>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Badge
        variant="outline"
        className="text-xs font-normal gap-1 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
      >
        <FileText className="w-3 h-3" />
        {label}
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </Badge>
    </a>
  );
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function AnalysisResults({
  result,
  traceUrl,
  documents = [],
}: AnalysisResultsProps) {
  if (!isInvestmentAnalysis(result)) {
    return (
      <Card className="border-rose-200 bg-rose-50/50">
        <CardContent className="py-6 px-4">
          <p className="text-sm text-rose-700">Unable to display analysis results.</p>
          <p className="text-xs text-slate-500 mt-2">
            Re-run analysis to generate the updated report format with investment score.
          </p>
          {"error" in (result as object) && (
            <p className="text-xs text-rose-600 mt-2">
              {(result as { error: string }).error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const analysis = result;
  const { verdict } = analysis;
  const rec = verdict.recommendation;

  return (
    <div className="space-y-6">
      {traceUrl && (
        <a
          href={traceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
        >
          Developer: LangSmith trace
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl sm:text-5xl font-bold tabular-nums ${scoreColor(verdict.score)}`}
              >
                {Math.round(verdict.score)}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                  Investment score
                </p>
                <Badge
                  className={`mt-1 text-sm font-semibold border ${RECOMMENDATION_STYLES[rec]}`}
                >
                  {RECOMMENDATION_LABELS[rec]}
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
              <p className="font-semibold text-slate-900">{verdict.headline}</p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{verdict.summary}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Score is model-generated from uploaded documents only — not financial advice.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
              Bull Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.bullCase.points.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No bull case points identified.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {analysis.bullCase.points.map((point, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-600 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-rose-800">
              <TrendingDown className="w-4 h-4" />
              Bear Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.bearCase.points.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No bear case points identified.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {analysis.bearCase.points.map((point, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-600 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.keyMetrics.map((metric) => {
              const missing =
                metric.value === null ||
                metric.value.trim().toLowerCase() === "null";
              return (
                <div
                  key={metric.label}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-sm font-medium text-slate-800">{metric.label}</span>
                  <div className="text-sm text-slate-600 text-left sm:text-right">
                    {missing ? (
                      <span className="italic text-slate-400">
                        Not found in uploaded documents
                      </span>
                    ) : (
                      <span>{metric.value}</span>
                    )}
                    {!missing && metric.citation && (
                      <div className="mt-1 flex justify-start sm:justify-end">
                        <CitationBadge citation={metric.citation} documents={documents} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4" />
            Key Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            {analysis.keyRisks.points.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {analysis.sourcesUsed && analysis.sourcesUsed.length > 0 && (
        <SourcesUsedSection sources={analysis.sourcesUsed} />
      )}
    </div>
  );
}

function SourcesUsedSection({ sources }: { sources: SourceDocument[] }) {
  return (
    <Card className="border-slate-200 bg-slate-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Sources used in this analysis
        </CardTitle>
        <p className="text-xs text-slate-500 font-normal">
          Pages retrieved from your uploads during metric and qualitative search.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((src) => (
          <div
            key={src.fileId}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-slate-900">{src.fileName}</span>
              <span className="text-xs text-slate-500">
                ({src.usedInSections.join(", ")})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {src.pages.map((page) => (
                <a
                  key={page}
                  href={`/api/documents/${src.fileId}/view?page=${page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  >
                    p.{page}
                    <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
