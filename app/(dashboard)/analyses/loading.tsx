import { Card, CardContent } from "@/components/ui/card";
import { RecentAnalysesSkeleton } from "@/components/skeletons/analysis-card-skeleton";

export default function AnalysesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-9 bg-slate-200 rounded animate-pulse w-32 max-w-full mb-2" />
        <div className="h-5 bg-slate-100 rounded animate-pulse w-64 max-w-full" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analyses list skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-40" />
        <RecentAnalysesSkeleton />
        <RecentAnalysesSkeleton />
      </div>
    </div>
  );
}
