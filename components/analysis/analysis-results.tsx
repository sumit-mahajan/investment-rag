"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface AnalysisResultsProps {
  analysis: {
    verdict?: string;
    confidenceScore?: string;
    summary?: string;
    results?: Array<{
      criterionName: string;
      score: number;
      findings: string;
    }>;
  };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const verdictColor = {
    POSITIVE: "bg-green-100 text-green-800",
    NEGATIVE: "bg-red-100 text-red-800",
    NEUTRAL: "bg-gray-100 text-gray-800",
    MIXED: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      {/* Overall Verdict */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall Verdict</CardTitle>
            {analysis.verdict && (
              <Badge className={verdictColor[analysis.verdict as keyof typeof verdictColor]}>
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
