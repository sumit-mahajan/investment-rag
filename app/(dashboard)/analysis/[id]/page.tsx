import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { AnalysisForm } from "@/components/analysis/analysis-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id: fileId } = await params;

  if (!userId) redirect("/sign-in");

  const documentService = container.resolve(DocumentService);

  let file;
  try {
    file = await documentService.getFile(userId, fileId);
  } catch {
    notFound();
  }

  if (file.status !== "completed") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{file.fileName}</h1>
        </div>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-8 px-4 text-center">
            <p className="font-semibold text-slate-900 mb-2">Document Not Ready</p>
            <p className="text-sm text-slate-600">
              {file.status === "processing"
                ? "This document is still being processed. Refresh in a few minutes."
                : "This document is not available for analysis."}
            </p>
            <Link href="/dashboard" className="inline-block mt-4">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{file.fileName}</h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-500">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">{file.chunkCount ?? 0} chunks indexed</span>
          </div>
        </div>
      </div>
      <AnalysisForm documentIds={[fileId]} />
    </div>
  );
}
