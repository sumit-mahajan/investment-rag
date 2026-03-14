import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { DocumentService } from "@/lib/services/document.service";
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

  const analysisService = container.resolve(AnalysisService);
  const documentService = container.resolve(DocumentService);

  let analysisWithCriteria;
  try {
    analysisWithCriteria = await analysisService.getAnalysis(userId, id);
  } catch {
    notFound();
  }

  const { criteria, ...analysis } = analysisWithCriteria;

  // Fetch document for display (header, links)
  let document: { id: string; originalName: string; companyName: string | null };
  try {
    const doc = await documentService.getDocument(userId, analysis.documentId);
    document = { id: doc.id, originalName: doc.originalName, companyName: doc.companyName ?? null };
  } catch {
    // Document may have been deleted; use documentId for links
    document = { id: analysis.documentId, originalName: "Unknown", companyName: null };
  }

  // Build results for AnalysisResults - support both legacy (array) and new (object with criteria + philosophies) formats
  type CriterionResult = { criterionName: string; score: number; findings: string };
  type PhilosophyResult = {
    philosophyId: string;
    philosophyName: string;
    verdict: string;
    confidenceScore: number;
    metricsFound: string[];
    metricsNotFound: string[];
    findings: string;
  };
  const rawResults = analysis.results as
    | CriterionResult[]
    | { criteria?: CriterionResult[]; philosophies?: PhilosophyResult[] }
    | null
    | undefined;

  const results: CriterionResult[] =
    Array.isArray(rawResults)
      ? rawResults
      : (rawResults as { criteria?: CriterionResult[] })?.criteria ??
        criteria.map((c) => ({
          criterionName: c.criterionName,
          score: c.score ? parseFloat(c.score) : 0,
          findings: c.findings ?? "",
        }));

  const philosophies: PhilosophyResult[] =
    rawResults && !Array.isArray(rawResults) && (rawResults as { philosophies?: PhilosophyResult[] }).philosophies
      ? (rawResults as { philosophies: PhilosophyResult[] }).philosophies
      : [];

  const analysisForDisplay = {
    ...analysis,
    results,
    philosophies,
  };

  const verdictStyles: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: "bg-emerald-100", text: "text-emerald-700" },
    NEGATIVE: { bg: "bg-rose-100", text: "text-rose-700" },
    NEUTRAL: { bg: "bg-slate-100", text: "text-slate-700" },
    MIXED: { bg: "bg-amber-100", text: "text-amber-700" },
  };

  if (analysis.status === "running" || analysis.status === "pending") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              {document?.companyName || document?.originalName || "Analysis"}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Analysis in progress
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
            <div className="p-3 sm:p-4 rounded-full bg-blue-100 mb-4">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
            </div>
            <p className="font-semibold text-sm sm:text-base text-slate-900 mb-2">Analyzing document...</p>
            <p className="text-xs sm:text-sm text-slate-600 text-center max-w-md">
              This may take a few minutes. We're analyzing the document against your selected criteria.
            </p>
            <Link href="/analyses" className="mt-6">
              <Button variant="outline" className="text-xs sm:text-sm">Back to Analyses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              {document?.companyName || document?.originalName || "Analysis"}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Analysis failed
            </p>
          </div>
        </div>

        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="py-8 sm:py-12 px-4">
            <div className="text-center">
              <Badge className="bg-rose-100 text-rose-700 mb-4 text-xs">
                Failed
              </Badge>
              <p className="text-xs sm:text-sm text-slate-600">{analysis.error ?? "Analysis failed"}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6">
                <Link href={`/analysis/${document?.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Run New Analysis
                  </Button>
                </Link>
                <Link href="/analyses">
                  <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">Back to Analyses</Button>
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
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                {document?.companyName || document?.originalName || "Analysis"}
              </h1>
              {analysis.verdict && verdictStyle && (
                <Badge className={`${verdictStyle.bg} ${verdictStyle.text} border-0 text-xs self-start`}>
                  {analysis.verdict}
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5 text-xs sm:text-sm text-slate-500">
              {document?.companyName && document?.originalName && (
                <span className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{document.originalName}</span>
                </span>
              )}
              <span className="hidden sm:inline">•</span>
              <span>{formatDateTime(analysis.completedAt ?? analysis.updatedAt)}</span>
            </div>
          </div>
        </div>
        <Link href={`/analysis/${document?.id}`} className="ml-11 sm:ml-0">
          <Button variant="outline" className="shrink-0 text-xs sm:text-sm h-8 sm:h-10">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Results */}
      <AnalysisResults analysis={analysisForDisplay} />
    </div>
  );
}
