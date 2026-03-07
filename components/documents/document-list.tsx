"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { DocumentListItem } from "@/lib/types";

export function DocumentList({ documents }: { documents: DocumentListItem[] }) {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-3 rounded-full bg-slate-100 mb-3">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900 mb-1">No documents yet</p>
          <p className="text-xs text-slate-500 text-center max-w-[250px]">
            Upload your first financial document to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card 
          key={doc.id} 
          className="border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-lg bg-blue-50 shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {doc.companyName || doc.originalName}
                  </h3>
                  {doc.companyName && (
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {doc.originalName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{doc.totalChunks} chunks</span>
                    <span>•</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {doc.status === "completed" ? (
                  <>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                    <Link href={`/analysis/${doc.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Analyze
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </>
                ) : doc.status === "processing" ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(doc.id)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
