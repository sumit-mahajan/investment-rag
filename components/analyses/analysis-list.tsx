"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { BarChart3, ArrowRight, FileText, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

interface Analysis {
  id: string;
  documentId: string;
  status: string;
  verdict?: string | null;
  confidenceScore?: string | null;
  summary?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  documentName: string;
  companyName?: string | null;
}

const verdictStyles: Record<string, { bg: string; text: string; icon: string }> = {
  POSITIVE: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    icon: "text-emerald-600" 
  },
  NEGATIVE: { 
    bg: "bg-rose-100", 
    text: "text-rose-700", 
    icon: "text-rose-600" 
  },
  NEUTRAL: { 
    bg: "bg-slate-100", 
    text: "text-slate-700", 
    icon: "text-slate-600" 
  },
  MIXED: { 
    bg: "bg-amber-100", 
    text: "text-amber-700", 
    icon: "text-amber-600" 
  },
};

export function AnalysisList({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-blue-50 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses yet</h3>
          <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
            Run an analysis on a document to see your results here. Upload a document and start analyzing.
          </p>
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Go to Workspace
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => {
        const verdictStyle = analysis.verdict ? verdictStyles[analysis.verdict] : null;
        
        return (
          <Link
            key={analysis.id}
            href={`/analyses/${analysis.id}`}
            className="block group"
          >
            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${verdictStyle?.bg || 'bg-blue-50'}`}>
                      <BarChart3 className={`w-5 h-5 ${verdictStyle?.icon || 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {analysis.companyName || analysis.documentName}
                      </h3>
                      {analysis.companyName && (
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {analysis.documentName}
                        </p>
                      )}
                      {analysis.summary && analysis.status === "completed" && (
                        <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                          {analysis.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>{formatDateTime(analysis.createdAt)}</span>
                        {analysis.confidenceScore && (
                          <>
                            <span>•</span>
                            <span>
                              Confidence: {(parseFloat(analysis.confidenceScore) * 100).toFixed(0)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {analysis.verdict && (
                      <Badge className={`${verdictStyle?.bg} ${verdictStyle?.text} border-0`}>
                        {analysis.verdict}
                      </Badge>
                    )}
                    {analysis.status === "running" && (
                      <Badge className="bg-amber-100 text-amber-700 border-0">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Running
                      </Badge>
                    )}
                    {analysis.status === "pending" && (
                      <Badge className="bg-slate-100 text-slate-700 border-0">
                        Pending
                      </Badge>
                    )}
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
