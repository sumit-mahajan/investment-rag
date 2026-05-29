"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { BarChart3, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import type { Analysis } from "@/lib/types/domain-models";

export function AnalysisList({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
          <div className="p-3 sm:p-4 rounded-full bg-blue-50 mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No analyses yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mb-6">
            Run an analysis on a document to see your results here.
          </p>
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm">Go to Workspace</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <Link key={analysis.id} href={`/analyses/${analysis.id}`} className="block group">
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-blue-600">
                      {analysis.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(analysis.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {analysis.status === "running" ? (
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      Running
                    </Badge>
                  ) : analysis.status === "failed" ? (
                    <Badge className="bg-rose-100 text-rose-700 border-0 text-xs">
                      Failed
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      Completed
                    </Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
