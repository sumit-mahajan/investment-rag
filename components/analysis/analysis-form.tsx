"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CriteriaSelector } from "@/components/analysis/criteria-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { startAnalysisAction } from "@/app/actions/analyses";
import { toast } from "sonner";

interface AnalysisFormProps {
  documentId: string;
}

export function AnalysisForm({ documentId }: AnalysisFormProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analysisId) {
      const interval = setInterval(() => {
        checkAnalysisStatus(analysisId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [analysisId]);

  const handleAnalyze = async (criteriaIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await startAnalysisAction(documentId, criteriaIds);

      if (result.success) {
        setAnalysisId(result.data.analysisId);
        toast.success("Analysis started");
      } else {
        setError(result.error);
        toast.error(result.error);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      const errorMessage = "Failed to start analysis";
      setError(errorMessage);
      toast.error(errorMessage);
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
          toast.success("Analysis completed");
          router.push(`/analyses/${data.id}`);
        } else if (data.status === "failed") {
          setError(data.error ?? "Analysis failed");
          toast.error(data.error ?? "Analysis failed");
          setIsAnalyzing(false);
          setAnalysisId(null);
        }
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
    }
  };

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
          <p className="text-rose-700 font-medium text-sm sm:text-base mb-1">Analysis Failed</p>
          <p className="text-xs sm:text-sm text-rose-600">{error}</p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            You can try running the analysis again with different criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-center justify-center py-10 sm:py-12 px-4">
          <div className="text-center">
            <div className="p-3 sm:p-4 rounded-full bg-blue-100 inline-flex mb-4">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
            </div>
            <p className="font-semibold text-sm sm:text-base text-slate-900 mb-2">Analyzing document...</p>
            <p className="text-xs sm:text-sm text-slate-600">This may take a few minutes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CriteriaSelector
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
    />
  );
}
