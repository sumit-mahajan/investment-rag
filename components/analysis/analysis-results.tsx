"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const verdictColor = {
    POSITIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    NEGATIVE: "bg-rose-500/15 text-rose-700 border-rose-200",
    NEUTRAL: "bg-slate-500/15 text-slate-700 border-slate-200",
    MIXED: "bg-amber-500/15 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-6">
      {/* Overall Verdict */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall Verdict</CardTitle>
            {analysis.verdict && (
              <Badge
                variant="outline"
                className={verdictColor[analysis.verdict as keyof typeof verdictColor]}
              >
                {analysis.verdict}
              </Badge>
            )}
          </div>
          {analysis.confidenceScore && (
            <CardDescription>
              Confidence: {(parseFloat(analysis.confidenceScore) * 100).toFixed(0)}%
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {analysis.results && analysis.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
            <CardDescription>Analysis results for each criterion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analysis.results.map((result, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{result.criterionName}</h3>
                    <span className="text-sm font-medium">
                      Score: {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={result.score * 100} className="h-2" />
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {result.findings}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
