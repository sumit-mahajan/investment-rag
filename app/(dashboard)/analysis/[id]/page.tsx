"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CriteriaSelector } from "@/components/analysis/criteria-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{document.originalName}</h1>
        <p className="text-muted-foreground mt-1">
          {document.companyName || "Financial Document Analysis"}
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-6">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mt-1">
              You can try running the analysis again with different criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-medium">Analyzing document...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few minutes</p>
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
