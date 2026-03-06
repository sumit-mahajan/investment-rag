"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { BarChart3, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

interface Analysis {
  id: string;
  documentId: string;
  status: string;
  verdict?: string | null;
  confidenceScore?: string | null;
  summary?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  documentName: string;
  companyName?: string | null;
}

const verdictStyles: Record<string, string> = {
  POSITIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800",
  NEGATIVE: "bg-rose-500/15 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800",
  NEUTRAL: "bg-slate-500/15 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-800",
  MIXED: "bg-amber-500/15 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
};

const statusStyles: Record<string, string> = {
  completed: "bg-primary/10 text-primary border-primary/20",
  running: "bg-amber-500/15 text-amber-700 border-amber-200 animate-pulse",
  pending: "bg-slate-500/15 text-slate-600 border-slate-200",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AnalysisList({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            Run an analysis on a document to see your results here. Upload a document and start analyzing.
          </p>
          <Link href="/documents">
            <Button>Go to Documents</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card
          key={analysis.id}
          className="group transition-all hover:shadow-md hover:border-primary/20"
        >
          <Link href={`/analyses/${analysis.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                    {analysis.documentName}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                    {analysis.companyName && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {analysis.companyName}
                      </span>
                    )}
                    <span className="text-muted-foreground/80">
                      {formatDateTime(analysis.createdAt)}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {analysis.verdict && (
                    <Badge
                      variant="outline"
                      className={verdictStyles[analysis.verdict] ?? "bg-muted"}
                    >
                      {analysis.verdict}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={statusStyles[analysis.status] ?? "bg-muted"}
                  >
                    {analysis.status}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </CardHeader>
            {analysis.summary && analysis.status === "completed" && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {analysis.summary}
                </p>
                {analysis.confidenceScore && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {(parseFloat(analysis.confidenceScore) * 100).toFixed(0)}%
                  </p>
                )}
              </CardContent>
            )}
          </Link>
        </Card>
      ))}
    </div>
  );
}
