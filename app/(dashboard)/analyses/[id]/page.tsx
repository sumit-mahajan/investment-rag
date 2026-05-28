import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { AnalysisStatusPoller } from "@/components/analysis/analysis-status-poller";
import { AnalysisChat } from "@/components/analysis/analysis-chat";
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

  if (!userId) redirect("/sign-in");

  const analysisService = container.resolve(AnalysisService);

  let analysis: Awaited<ReturnType<typeof analysisService.getAnalysis>>;
  try {
    analysis = await analysisService.getAnalysis(userId, id);
  } catch {
    notFound();
  }

  const analysisDocsList = analysis.documents;
  const isMultiDoc = analysisDocsList.length > 1;
  const primaryDoc = analysisDocsList[0];

  const newAnalysisHref = isMultiDoc
    ? `/analysis/multi?${analysisDocsList.map((d) => `docs=${d.fileId}`).join("&")}`
    : `/analysis/${primaryDoc?.fileId ?? ""}`;

  const resultError =
    analysis.result &&
    typeof analysis.result === "object" &&
    "error" in (analysis.result as object)
      ? String((analysis.result as { error: string }).error)
      : null;

  if (analysis.status === "running") {
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
              {analysis.label}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">Analysis in progress</p>
          </div>
        </div>

        <AnalysisStatusPoller />
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="font-semibold text-sm sm:text-base text-slate-900 mb-2">
              Analyzing {isMultiDoc ? `${analysisDocsList.length} documents` : "document"}…
            </p>
            <Link href="/analyses" className="mt-6">
              <Button variant="outline" className="text-xs sm:text-sm">Back to Analyses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resultError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">{analysis.label}</h1>
        </div>
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="py-8 px-4 text-center">
            <Badge className="bg-rose-100 text-rose-700 mb-4">Failed</Badge>
            <p className="text-sm text-slate-600">{resultError}</p>
            <Link href={newAnalysisHref} className="mt-6 inline-block">
              <Button className="bg-blue-600 hover:bg-blue-700">Run New Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1">
          <Link href="/analyses">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{analysis.label}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {formatDateTime(analysis.createdAt)}
            </p>
          </div>
        </div>
        <Link href={newAnalysisHref}>
          <Button variant="outline" size="sm">
            <Play className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      {isMultiDoc && (
        <div className="flex flex-wrap gap-2">
          {analysisDocsList.map((d) => (
            <div
              key={d.fileId}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <FileText className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate max-w-[200px]">{d.fileName}</span>
            </div>
          ))}
        </div>
      )}

      <AnalysisResults
        result={analysis.result}
        traceUrl={
          process.env.SHOW_LANGSMITH_TRACE === "true" ? analysis.traceUrl : null
        }
        documents={analysisDocsList}
      />

      <AnalysisChat analysisId={analysis.id} />
    </div>
  );
}
