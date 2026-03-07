import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function AnalysisResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overall verdict skeleton */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
              <div className="h-8 bg-slate-300 rounded animate-pulse w-48" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6" />
          </div>
        </CardContent>
      </Card>

      {/* Criteria results skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 bg-slate-200 rounded animate-pulse w-40" />
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-11/12" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
