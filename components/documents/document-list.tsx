"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { DocumentListItem } from "@/lib/types";
import { deleteDocumentAction } from "@/app/actions/documents";
import { toast } from "sonner";

export function DocumentList({ documents }: { documents: DocumentListItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const completedDocs = documents.filter((d) => d.status === "completed");
  const canSelect = completedDocs.length > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === completedDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(completedDocs.map((d) => d.id)));
    }
  };

  const handleBulkAnalyze = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("docs", id));
    router.push(`/analysis/multi?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeletingId(id);
    try {
      const result = await deleteDocumentAction(id);

      if (result.success) {
        toast.success(result.data.message);
        router.refresh();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
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
      {/* Bulk actions bar */}
      {canSelect && (
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedIds.size === completedDocs.length && completedDocs.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span className="text-xs text-slate-500">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : "Select for bulk analysis"}
            </span>
          </label>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={handleBulkAnalyze}
              className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-3"
            >
              <BarChart3 className="w-3 h-3 mr-1.5" />
              Analyze {selectedIds.size > 1 ? `${selectedIds.size} Docs` : "Doc"}
            </Button>
          )}
        </div>
      )}

      {documents.map((doc) => {
        const isCompleted = doc.status === "completed";
        const isSelected = selectedIds.has(doc.id);

        return (
          <Card
            key={doc.id}
            className={`border-slate-200 bg-white shadow-sm hover:shadow-md transition-all group ${
              isSelected ? "ring-2 ring-blue-500 border-blue-300" : "hover:border-blue-200"
            }`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Checkbox for completed docs */}
                  {isCompleted ? (
                    <label className="pt-1 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </label>
                  ) : (
                    <div className="w-4 shrink-0" />
                  )}
                  <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {doc.companyName || doc.originalName}
                    </h3>
                    {doc.companyName && (
                      <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                        {doc.originalName}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                      {doc.fileSize != null && <span>{formatFileSize(doc.fileSize)}</span>}
                      {doc.fileSize != null && <span className="hidden xs:inline">&middot;</span>}
                      <span>{doc.totalChunks} chunks</span>
                      {doc.createdAt && (
                        <>
                          <span className="hidden xs:inline">&middot;</span>
                          <span>{formatDate(doc.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-9 sm:pl-0">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                        <Link href={`/analysis/${doc.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8">
                            Analyze
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </>
                    ) : doc.status === "processing" ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
