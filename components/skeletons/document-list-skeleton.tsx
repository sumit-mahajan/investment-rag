import { Card, CardContent } from "@/components/ui/card";

export function DocumentListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 animate-pulse">
                <div className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="flex items-center gap-4">
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
