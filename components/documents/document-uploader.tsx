"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadState {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "registering" | "done" | "error";
  error?: string;
}

export function DocumentUploader() {
  const router = useRouter();
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") return "Only PDF files are allowed";
    if (file.size > 50 * 1024 * 1024) return "File size must be less than 50MB";
    return null;
  };

  const addFiles = (newFiles: File[]) => {
    const validated: FileUploadState[] = [];
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        continue;
      }
      validated.push({ file, progress: 0, status: "pending" });
    }
    if (validated.length > 0) {
      setFiles((prev) => [...prev, ...validated]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) addFiles(selected);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (
    fileState: FileUploadState,
    index: number
  ): Promise<boolean> => {
    const updateFile = (patch: Partial<FileUploadState>) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
      );
    };

    try {
      updateFile({ status: "uploading", progress: 0 });

      const blob = await upload(fileState.file.name, fileState.file, {
        access: "public",
        handleUploadUrl: "/api/documents/upload",
        onUploadProgress: ({ percentage }) => {
          updateFile({ progress: Math.round(percentage * 0.8) });
        },
      });

      updateFile({ status: "registering", progress: 90 });

      const registerRes = await fetch("/api/documents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url, filename: fileState.file.name }),
      });

      const registerData = (await registerRes.json()) as {
        error?: string;
        fileId?: string;
        status?: string;
      };

      if (!registerRes.ok) {
        throw new Error(registerData.error ?? "Failed to queue document for indexing");
      }

      updateFile({ status: "done", progress: 100 });
      router.refresh();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      updateFile({ status: "error", error: errorMessage });
      toast.error(`${fileState.file.name}: ${errorMessage}`);
      return false;
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setUploading(true);

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      const ok = await uploadSingleFile(files[i], i);
      if (ok) successCount++;
    }

    setUploading(false);

    if (successCount > 0) {
      const label = successCount === 1 ? "document" : "documents";
      toast.success(
        `${successCount} ${label} queued — indexing continues in the background (1–3 min)`
      );
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "done"));
      }, 800);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Drop zone - always visible */}
          <label
            className="flex flex-col items-center justify-center w-full h-28 sm:h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-2 px-4">
              <div className="p-2.5 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-slate-900">
                  <span className="text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  PDF files only (MAX. 50MB) &middot; Multiple files supported
                </p>
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileState, index) => (
                <div
                  key={`${fileState.file.name}-${index}`}
                  className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <div className="p-1.5 rounded-lg bg-blue-100 shrink-0">
                    <FileText className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-slate-900 truncate">
                      {fileState.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">
                        {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileState.status === "uploading" && (
                        <span className="text-xs text-blue-600">{fileState.progress}%</span>
                      )}
                      {fileState.status === "registering" && (
                        <span className="text-xs text-blue-600">Queuing for indexing…</span>
                      )}
                      {fileState.status === "done" && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                      {fileState.status === "error" && (
                        <span className="text-xs text-rose-600">{fileState.error}</span>
                      )}
                    </div>
                    {(fileState.status === "uploading" || fileState.status === "registering") && (
                      <Progress value={fileState.progress} className="h-1 mt-1.5" />
                    )}
                  </div>
                  {!uploading && fileState.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="shrink-0 h-7 w-7 p-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {pendingCount > 0 && !uploading && (
            <Button
              onClick={handleUpload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm h-9 sm:h-10"
            >
              Upload {pendingCount === 1 ? "Document" : `${pendingCount} Documents`}
            </Button>
          )}
          {uploading && (
            <p className="text-xs sm:text-sm text-center text-slate-500">
              {files.some((f) => f.status === "registering")
                ? "Queuing documents for background indexing…"
                : "Uploading to storage…"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
