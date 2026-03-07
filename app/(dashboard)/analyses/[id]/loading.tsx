import { Card, CardContent } from "@/components/ui/card";
import { AnalysisResultsSkeleton } from "@/components/skeletons/analysis-results-skeleton";

export default function AnalysisDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 bg-slate-200 rounded animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-64" />
            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-28" />
          </div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse shrink-0" />
      </div>

      {/* Results skeleton */}
      <AnalysisResultsSkeleton />
    </div>
  );
}
