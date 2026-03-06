"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CriteriaSelector } from "@/components/analysis/criteria-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (analysisId) {
      const interval = setInterval(() => {
        checkAnalysisStatus(analysisId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [analysisId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  const handleAnalyze = async (criteriaIds: string[]) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: resolvedParams.id,
          criteriaIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisId(data.analysisId);
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      setIsAnalyzing(false);
    }
  };

  const checkAnalysisStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/analyses/${id}`);
      if (response.ok) {
        const data = await response.json();

        if (data.status === "completed") {
          setIsAnalyzing(false);
          setAnalysisId(null);
          router.push(`/analyses/${data.id}`);
        } else if (data.status === "failed") {
          setError(data.error ?? "Analysis failed");
          setIsAnalyzing(false);
          setAnalysisId(null);
        }
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
    }
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {document.companyName || document.originalName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            <span>{document.originalName}</span>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="py-6">
            <p className="text-rose-700 font-medium mb-1">Analysis Failed</p>
            <p className="text-sm text-rose-600">{error}</p>
            <p className="text-sm text-slate-600 mt-2">
              You can try running the analysis again with different criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="p-4 rounded-full bg-blue-100 inline-flex mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <p className="font-semibold text-slate-900 mb-2">Analyzing document...</p>
              <p className="text-sm text-slate-600">This may take a few minutes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAnalyzing && (
        <CriteriaSelector
          onAnalyze={(ids) => {
            setError(null);
            handleAnalyze(ids);
          }}
          isAnalyzing={isAnalyzing}
        />
      )}
    </div>
  );
}
