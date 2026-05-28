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

export default async function MultiDocAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ docs?: string | string[] }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const rawDocs = params.docs;
  const fileIds = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : [];

  if (fileIds.length === 0) notFound();

  const documentService = container.resolve(DocumentService);

  const files = await Promise.all(
    fileIds.map(async (id) => {
      try {
        return await documentService.getFile(userId, id);
      } catch {
        return null;
      }
    })
  );

  const validFiles = files.filter((f): f is NonNullable<typeof f> => f !== null);
  if (validFiles.length === 0) notFound();

  const allCompleted = validFiles.every((f) => f.status === "completed");

  if (!allCompleted) {
    const pending = validFiles.filter((f) => f.status !== "completed");
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-1">
        <h1 className="text-2xl font-bold">Multi-Document Analysis</h1>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-8 px-4 text-center">
            <p className="font-semibold mb-2">Documents Not Ready</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {pending.map((f) => (
                <li key={f.fileId}>
                  {f.fileName} — {f.status}
                </li>
              ))}
            </ul>
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
      <div className="flex items-start gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Multi-Document Analysis</h1>
          <p className="text-sm text-slate-500">{validFiles.length} documents</p>
        </div>
      </div>

      <div className="space-y-2">
        {validFiles.map((f) => (
          <div
            key={f.fileId}
            className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-xl bg-slate-50"
          >
            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
            <p className="font-medium text-sm truncate">{f.fileName}</p>
          </div>
        ))}
      </div>

      <AnalysisForm documentIds={validFiles.map((f) => f.fileId)} />
    </div>
  );
}
