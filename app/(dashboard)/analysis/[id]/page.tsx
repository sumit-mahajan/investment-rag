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
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch document directly using DocumentService
  const documentService = container.resolve(DocumentService);
  
  let document;
  try {
    document = await documentService.getDocument(userId, id);
  } catch (error) {
    notFound();
  }

  // Only allow analysis if document processing is complete
  if (document.status !== "completed") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              {document.companyName || document.originalName}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-500">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{document.originalName}</span>
            </div>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-6 sm:py-8 px-4">
            <div className="text-center">
              <p className="font-semibold text-sm sm:text-base text-slate-900 mb-2">Document Not Ready</p>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                {document.status === "processing" 
                  ? "This document is still being processed. Please wait a few minutes and try again."
                  : "This document failed to process. Please upload it again."}
              </p>
              <Link href="/dashboard" className="inline-block mt-4">
                <Button variant="outline" className="text-xs sm:text-sm">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
            {document.companyName || document.originalName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-500">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{document.originalName}</span>
          </div>
        </div>
      </div>

      {/* Analysis Form (Client Component) */}
      <AnalysisForm documentId={id} />
    </div>
  );
}
