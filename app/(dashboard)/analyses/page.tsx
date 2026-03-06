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
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analyses</h1>
            <p className="text-muted-foreground mt-0.5">
              View and explore your document analysis results
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Analyses</h2>
        <AnalysisList analyses={userAnalyses as any} />
      </div>
    </div>
  );
}
