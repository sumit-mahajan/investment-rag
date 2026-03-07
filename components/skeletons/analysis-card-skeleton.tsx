import { Card, CardContent } from "@/components/ui/card";

export function AnalysisCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-24" />
          </div>
          <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentAnalysesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <AnalysisCardSkeleton key={i} />
      ))}
    </div>
  );
}
