import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { analyses, documents, analysisCriteria } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const [analysis] = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.userId, userId)));

  if (!analysis) {
    notFound();
  }

  const [document] = await db
    .select({
      originalName: documents.originalName,
      companyName: documents.companyName,
      id: documents.id,
    })
    .from(documents)
    .where(eq(documents.id, analysis.documentId));

  const criteria = await db
    .select()
    .from(analysisCriteria)
    .where(eq(analysisCriteria.analysisId, id));

  // Build results for AnalysisResults - use analysis.results if available, else map from criteria
  const results =
    (analysis.results as Array<{ criterionName: string; score: number; findings: string }>) ??
    criteria.map((c) => ({
      criterionName: c.criterionName,
      score: c.score ? parseFloat(c.score) : 0,
      findings: c.findings ?? "",
    }));

  const analysisForDisplay = {
    ...analysis,
    results,
  };

  const verdictStyles: Record<string, string> = {
    POSITIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    NEGATIVE: "bg-rose-500/15 text-rose-700 border-rose-200",
    NEUTRAL: "bg-slate-500/15 text-slate-700 border-slate-200",
    MIXED: "bg-amber-500/15 text-amber-700 border-amber-200",
  };

  if (analysis.status === "running" || analysis.status === "pending") {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {document?.originalName ?? "Analysis"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {document?.companyName ?? "Document"}
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-muted">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="font-medium">Analysis in progress</p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a few minutes. Check back shortly.
            </p>
            <Link href="/analyses" className="mt-6">
              <Button variant="outline">Back to Analyses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {document?.originalName ?? "Analysis"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {document?.companyName ?? "Document"}
            </p>
          </div>
        </div>

        <Card className="border-destructive/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Badge variant="destructive" className="mb-4">
                Failed
              </Badge>
              <p className="text-muted-foreground">{analysis.error ?? "Analysis failed"}</p>
              <div className="flex gap-4 justify-center mt-6">
                <Link href={`/analysis/${document?.id}`}>
                  <Button>Run New Analysis</Button>
                </Link>
                <Link href="/analyses">
                  <Button variant="outline">Back to Analyses</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {document?.originalName ?? "Analysis"}
              </h1>
              {analysis.verdict && (
                <Badge
                  variant="outline"
                  className={verdictStyles[analysis.verdict] ?? ""}
                >
                  {analysis.verdict}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              {document?.companyName && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {document.companyName}
                </span>
              )}
              <span>{formatDateTime(analysis.completedAt ?? analysis.updatedAt)}</span>
            </div>
          </div>
        </div>
        <Link href={`/analysis/${document?.id}`}>
          <Button variant="outline">Run New Analysis</Button>
        </Link>
      </div>

      {/* Results */}
      <AnalysisResults analysis={analysisForDisplay} />
    </div>
  );
}
