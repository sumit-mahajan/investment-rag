import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { analyses, documents, analysisCriteria } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Play } from "lucide-react";
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

  const verdictStyles: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: "bg-emerald-100", text: "text-emerald-700" },
    NEGATIVE: { bg: "bg-rose-100", text: "text-rose-700" },
    NEUTRAL: { bg: "bg-slate-100", text: "text-slate-700" },
    MIXED: { bg: "bg-amber-100", text: "text-amber-700" },
  };

  if (analysis.status === "running" || analysis.status === "pending") {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {document?.companyName || document?.originalName || "Analysis"}
            </h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Analysis in progress
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-100 mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <p className="font-semibold text-slate-900 mb-2">Analyzing document...</p>
            <p className="text-sm text-slate-600 text-center max-w-md">
              This may take a few minutes. We're analyzing the document against your selected criteria.
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {document?.companyName || document?.originalName || "Analysis"}
            </h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Analysis failed
            </p>
          </div>
        </div>

        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Badge className="bg-rose-100 text-rose-700 mb-4">
                Failed
              </Badge>
              <p className="text-slate-600">{analysis.error ?? "Analysis failed"}</p>
              <div className="flex gap-4 justify-center mt-6">
                <Link href={`/analysis/${document?.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Run New Analysis
                  </Button>
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

  const verdictStyle = analysis.verdict ? verdictStyles[analysis.verdict] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/analyses">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {document?.companyName || document?.originalName || "Analysis"}
            </h1>
            {analysis.verdict && verdictStyle && (
              <Badge className={`${verdictStyle.bg} ${verdictStyle.text} border-0`}>
                {analysis.verdict}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
            {document?.companyName && document?.originalName && (
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                {document.originalName}
              </span>
            )}
            <span>{formatDateTime(analysis.completedAt ?? analysis.updatedAt)}</span>
          </div>
        </div>
        <Link href={`/analysis/${document?.id}`}>
          <Button variant="outline" className="shrink-0">
            <Play className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Results */}
      <AnalysisResults analysis={analysisForDisplay} />
    </div>
  );
}
