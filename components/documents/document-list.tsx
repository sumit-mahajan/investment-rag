"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDate, formatFileSize } from "@/lib/utils";

interface Document {
  id: string;
  originalName: string;
  companyName?: string | null;
  tickerSymbol?: string | null;
  status: string;
  fileSize: number;
  totalChunks: number;
  createdAt: Date;
}

export function DocumentList({ documents }: { documents: Document[] }) {
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No documents yet</p>
          <p className="text-sm text-muted-foreground">
            Upload your first financial document to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{doc.originalName}</CardTitle>
                <CardDescription className="mt-1">
                  {doc.companyName && (
                    <span>
                      {doc.companyName}
                      {doc.tickerSymbol && ` (${doc.tickerSymbol})`}
                    </span>
                  )}
                  {!doc.companyName && "Processing..."}
                </CardDescription>
              </div>
              <Badge
                variant={
                  doc.status === "completed"
                    ? "default"
                    : doc.status === "processing"
                      ? "secondary"
                      : doc.status === "failed"
                        ? "destructive"
                        : "outline"
                }
              >
                {doc.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Size: {formatFileSize(doc.fileSize)}</p>
                <p>Chunks: {doc.totalChunks}</p>
                <p>Uploaded: {formatDate(doc.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                {doc.status === "completed" && (
                  <Link href={`/analysis/${doc.id}`}>
                    <Button>Analyze</Button>
                  </Link>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>
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
