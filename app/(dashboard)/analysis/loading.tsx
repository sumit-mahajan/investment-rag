import { Card, CardContent } from "@/components/ui/card";

export default function AnalysisLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 bg-slate-100 rounded-md animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 sm:h-8 bg-slate-200 rounded animate-pulse w-2/3 max-w-md" />
          <div className="h-4 bg-slate-100 rounded animate-pulse w-40" />
        </div>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-48" />
          <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-200 rounded-lg animate-pulse w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
