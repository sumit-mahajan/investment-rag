import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { AnalysisService } from "@/lib/services/analysis.service";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import type { DocumentListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const documentService = container.resolve(DocumentService);
  const analysisService = container.resolve(AnalysisService);

  // Fetch documents and analyses via services (not direct DB)
  const [userDocuments, allAnalyses] = await Promise.all([
    documentService.listUserDocuments(userId),
    analysisService.listUserAnalyses(userId),
  ]);

  const recentAnalyses = allAnalyses.slice(0, 3);

  // Map to DocumentListItem (ensure totalChunks is number)
  const documentListItems: DocumentListItem[] = userDocuments.map((doc) => ({
    id: doc.id,
    originalName: doc.originalName,
    companyName: doc.companyName,
    tickerSymbol: doc.tickerSymbol,
    status: doc.status,
    fileSize: doc.fileSize,
    createdAt: doc.createdAt,
    totalChunks: doc.totalChunks ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Workspace</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Manage your documents and analyze financial reports
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Documents section - takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Documents</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Upload and manage financial reports</p>
            </div>
          </div>

          <DocumentUploader />

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 uppercase tracking-wide">
              Your Documents ({documentListItems.length})
            </h3>
            <DocumentList documents={documentListItems} />
          </div>
        </div>

        {/* Sidebar - Recent analyses */}
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Recent Analyses</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Latest results</p>
            </div>
          </div>

          {recentAnalyses.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 px-4">
                <div className="p-2.5 sm:p-3 rounded-full bg-slate-100 mb-3">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">No analyses yet</p>
                <p className="text-xs text-slate-500 text-center max-w-[200px]">
                  Upload a document and run an analysis to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/analyses/${analysis.id}`}
                  className="block group"
                >
                  <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {analysis.companyName || analysis.documentName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                        {analysis.verdict && (
                          <span
                            className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                              analysis.verdict === "POSITIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : analysis.verdict === "NEGATIVE"
                                  ? "bg-rose-100 text-rose-700"
                                  : analysis.verdict === "MIXED"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {analysis.verdict}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              <Link href="/analyses">
                <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
                  View All Analyses
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
