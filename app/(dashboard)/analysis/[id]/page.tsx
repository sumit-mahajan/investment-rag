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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {document.companyName || document.originalName}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>{document.originalName}</span>
            </div>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="font-semibold text-slate-900 mb-2">Document Not Ready</p>
              <p className="text-sm text-slate-600">
                {document.status === "processing" 
                  ? "This document is still being processed. Please wait a few minutes and try again."
                  : "This document failed to process. Please upload it again."}
              </p>
              <Link href="/dashboard" className="inline-block mt-4">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {document.companyName || document.originalName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            <span>{document.originalName}</span>
          </div>
        </div>
      </div>

      {/* Analysis Form (Client Component) */}
      <AnalysisForm documentId={id} />
    </div>
  );
}
