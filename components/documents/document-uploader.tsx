"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { registerDocumentAction } from "@/app/actions/documents";
import { toast } from "sonner";

export function DocumentUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    validateAndSetFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Upload directly to Vercel Blob from client
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/documents/upload",
        onUploadProgress: ({ percentage }) => {
          // Show upload progress (0-90%)
          setProgress(Math.round(percentage * 0.9));
        },
      });

      console.log("Blob upload completed:", blob.url);

      // Step 2: Register the uploaded document with our backend via Server Action
      setProgress(95);
      const result = await registerDocumentAction(blob.url, file.name);

      if (!result.success) {
        throw new Error(result.error);
      }

      setProgress(100);
      console.log("Document registered successfully");
      toast.success("Document uploaded and processing started");

      // Reset after success
      setTimeout(() => {
        setFile(null);
        setUploading(false);
        setProgress(0);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6">
        {!file ? (
          <div className="space-y-4">
            <label
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900">
                    <span className="text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF files only (MAX. 50MB)</p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
            {error && (
              <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!uploading && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {uploading && (
              <div className="space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2">
                  {progress === 100 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-600 font-medium">Processing document...</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">Uploading... {progress}%</p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            {!uploading && (
              <Button 
                onClick={handleUpload} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Upload and Process
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
