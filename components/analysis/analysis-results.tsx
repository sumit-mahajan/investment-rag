"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, TrendingUp, Shield, Target, Users, Scale, BarChart3 } from "lucide-react";

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
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-slate-900 mb-2">Overall Verdict</CardTitle>
              {analysis.confidenceScore && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Confidence Score:</span>
                  <span className="font-semibold text-slate-900">
                    {(parseFloat(analysis.confidenceScore) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {analysis.verdict && verdictStyle && VerdictIcon && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${verdictStyle.bg}`}>
                <VerdictIcon className={`w-4 h-4 ${verdictStyle.text}`} />
                <span className={`text-sm font-semibold ${verdictStyle.text}`}>
                  {analysis.verdict}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {analysis.results && analysis.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Detailed Analysis</h2>
          
          <div className="grid gap-4">
            {analysis.results.map((result, index) => {
              const scoreColor = getScoreColor(result.score);
              const Icon = criterionIcons[result.criterionName] || BarChart3;
              
              return (
                <Card 
                  key={index}
                  className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${scoreColor.bg} shrink-0`}>
                            <Icon className={`w-5 h-5 ${scoreColor.text}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{result.criterionName}</h3>
                          </div>
                        </div>
                        <Badge className={`${scoreColor.bg} ${scoreColor.text} border-0 text-sm font-semibold px-3 py-1`}>
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <Progress 
                          value={result.score * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Findings */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
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
