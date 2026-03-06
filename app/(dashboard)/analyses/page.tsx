import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { analyses, documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AnalysisList } from "@/components/analyses/analysis-list";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalysesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userAnalyses = await db
    .select({
      id: analyses.id,
      documentId: analyses.documentId,
      status: analyses.status,
      verdict: analyses.verdict,
      confidenceScore: analyses.confidenceScore,
      summary: analyses.summary,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      documentName: documents.originalName,
      companyName: documents.companyName,
    })
    .from(analyses)
    .innerJoin(documents, eq(analyses.documentId, documents.id))
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analyses</h1>
        <p className="text-slate-600 mt-1">
          View and explore your document analysis results
        </p>
      </div>

      <AnalysisList analyses={userAnalyses as any} />
    </div>
  );
}
