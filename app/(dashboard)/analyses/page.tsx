import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { container } from "@/lib/di";
import { AnalysisService } from "@/lib/services/analysis.service";
import { AnalysisList } from "@/components/analyses/analysis-list";

export const dynamic = "force-dynamic";

export default async function AnalysesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const analysisService = container.resolve(AnalysisService);
  const userAnalyses = await analysisService.listUserAnalyses(userId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Analyses</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          View and explore your document analysis results
        </p>
      </div>

      <AnalysisList analyses={userAnalyses} />
    </div>
  );
}
