"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, TrendingUp, Shield, Target, Users, Scale, BarChart3, Coins, Sparkles } from "lucide-react";

interface PhilosophyResult {
  philosophyId: string;
  philosophyName: string;
  verdict: string;
  confidenceScore: number;
  metricsFound: string[];
  metricsNotFound: string[];
  findings: string;
}

interface AnalysisResultsProps {
  analysis: {
    verdict?: string | null;
    confidenceScore?: string | null;
    summary?: string | null;
    results?: Array<{
      criterionName: string;
      score: number;
      findings: string;
    }>;
    philosophies?: PhilosophyResult[];
  };
}

const criterionIcons: Record<string, any> = {
  "Financial Health": BarChart3,
  "Risk Assessment": Shield,
  "Growth Potential": TrendingUp,
  "Competitive Position": Target,
  "Management Quality": Users,
  "Regulatory Compliance": Scale,
};

const philosophyIcons: Record<string, any> = {
  "Value Investing": Coins,
  "Growth Investing": Sparkles,
};

const getScoreColor = (score: number) => {
  if (score >= 0.7) return { bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-600" };
  if (score >= 0.5) return { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-600" };
  return { bg: "bg-rose-100", text: "text-rose-700", bar: "bg-rose-600" };
};

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const verdictStyles: Record<string, { bg: string; text: string; icon: any }> = {
    POSITIVE: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
    NEGATIVE: { bg: "bg-rose-100", text: "text-rose-700", icon: AlertTriangle },
    NEUTRAL: { bg: "bg-slate-100", text: "text-slate-700", icon: BarChart3 },
    MIXED: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  };

  const verdictStyle = analysis.verdict ? verdictStyles[analysis.verdict] : null;
  const VerdictIcon = verdictStyle?.icon;

  return (
    <div className="space-y-6">
      {/* Overall Verdict */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg text-slate-900 mb-2">Overall Verdict</CardTitle>
              {analysis.confidenceScore && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <span>Confidence Score:</span>
                  <span className="font-semibold text-slate-900">
                    {(parseFloat(analysis.confidenceScore) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {analysis.verdict && verdictStyle && VerdictIcon && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${verdictStyle.bg} self-start`}>
                <VerdictIcon className={`w-4 h-4 ${verdictStyle.text}`} />
                <span className={`text-xs sm:text-sm font-semibold ${verdictStyle.text}`}>
                  {analysis.verdict}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Investment Philosophy Analysis (Value & Growth) */}
      {analysis.philosophies && analysis.philosophies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Investment Philosophy Fit</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Analysis from value and growth investing perspectives. Metrics are extracted from the document when available.
          </p>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {analysis.philosophies.map((phil) => {
              const verdictStyles: Record<string, { bg: string; text: string }> = {
                POSITIVE: { bg: "bg-emerald-100", text: "text-emerald-700" },
                NEGATIVE: { bg: "bg-rose-100", text: "text-rose-700" },
                NEUTRAL: { bg: "bg-slate-100", text: "text-slate-700" },
                MIXED: { bg: "bg-amber-100", text: "text-amber-700" },
              };
              const vs = phil.verdict ? verdictStyles[phil.verdict] ?? verdictStyles.NEUTRAL : verdictStyles.NEUTRAL;
              const Icon = philosophyIcons[phil.philosophyName] ?? BarChart3;
              const hasMetrics = phil.metricsFound.length > 0;
              return (
                <Card
                  key={phil.philosophyId}
                  className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900">{phil.philosophyName}</h3>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 pl-9 sm:pl-0">
                          <Badge className={`${vs.bg} ${vs.text} border-0 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1`}>
                            {phil.verdict}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Confidence: {(phil.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {hasMetrics ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-600">Metrics found</p>
                          <ul className="text-xs sm:text-sm text-slate-700 space-y-1">
                            {phil.metricsFound.map((m, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                          No key metrics found in document. Verdict based on limited information.
                        </p>
                      )}
                      {phil.metricsNotFound.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500">Not found</p>
                          <p className="text-xs text-slate-500">{phil.metricsNotFound.join(", ")}</p>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                          {phil.findings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {analysis.results && analysis.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Detailed Analysis</h2>
          
          <div className="grid gap-4">
            {analysis.results.map((result, index) => {
              const scoreColor = getScoreColor(result.score);
              const Icon = criterionIcons[result.criterionName] || BarChart3;
              
              return (
                <Card 
                  key={index}
                  className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${scoreColor.bg} shrink-0`}>
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${scoreColor.text}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900">{result.criterionName}</h3>
                          </div>
                        </div>
                        <Badge className={`${scoreColor.bg} ${scoreColor.text} border-0 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 self-start ml-9 sm:ml-0`}>
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <Progress 
                          value={result.score * 100} 
                          className="h-1.5 sm:h-2"
                        />
                      </div>

                      {/* Findings */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                          {result.findings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
