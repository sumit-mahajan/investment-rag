import { Card, CardContent } from "@/components/ui/card";
import { DocumentListSkeleton } from "@/components/skeletons/document-list-skeleton";
import { RecentAnalysesSkeleton } from "@/components/skeletons/analysis-card-skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-9 bg-slate-200 rounded animate-pulse w-48 mb-2" />
        <div className="h-5 bg-slate-100 rounded animate-pulse w-80" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Documents section - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 bg-slate-200 rounded animate-pulse w-32" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-48" />
            </div>
          </div>

          {/* Upload card skeleton */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="p-3 rounded-full bg-slate-100 animate-pulse mb-3">
                  <div className="w-6 h-6" />
                </div>
                <div className="h-4 bg-slate-200 rounded animate-pulse w-48 mb-2" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-36" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="h-5 bg-slate-200 rounded animate-pulse w-40" />
            <DocumentListSkeleton />
          </div>
        </div>

        {/* Sidebar - Recent analyses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 bg-slate-200 rounded animate-pulse w-36" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
            </div>
          </div>
          <RecentAnalysesSkeleton />
        </div>
      </div>
    </div>
  );
}
