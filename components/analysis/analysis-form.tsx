"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DEFAULT_ANALYSIS_QUESTION } from "@/lib/agents/constants";
import { toast } from "sonner";

interface AnalysisFormProps {
  documentIds: string[];
  /** When true, starts the LangGraph pipeline immediately on mount */
  autoStart?: boolean;
}

export function AnalysisForm({ documentIds, autoStart = true }: AnalysisFormProps) {
  const router = useRouter();
  const [focusQuestion, setFocusQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const runAnalysis = useCallback(
    async (question?: string) => {
      if (documentIds.length === 0) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const q = question?.trim() || focusQuestion.trim() || DEFAULT_ANALYSIS_QUESTION;
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileIds: documentIds, question: q }),
        });
        const data = (await res.json()) as { analysisId?: string; error?: string };

        if (!res.ok) {
          const msg = data.error ?? "Failed to start analysis";
          setError(msg);
          toast.error(msg);
          return;
        }

        if (data.analysisId) {
          toast.success("Analysis started — results will appear shortly");
          router.push(`/analyses/${data.analysisId}`);
          router.refresh();
        } else {
          const msg = "Failed to start analysis";
          setError(msg);
          toast.error(msg);
        }
      } catch {
        const msg = "Failed to start analysis";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [documentIds, focusQuestion, router]
  );

  useEffect(() => {
    if (!autoStart || autoStarted.current || documentIds.length === 0) return;
    autoStarted.current = true;
    void runAnalysis(DEFAULT_ANALYSIS_QUESTION);
  }, [autoStart, documentIds, runAnalysis]);

  if (autoStart && isAnalyzing && !error) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex flex-col items-center justify-center py-10 px-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="font-semibold text-slate-900">Running investment analysis…</p>
          <p className="text-sm text-slate-600 mt-1 text-center max-w-md">
            Extracting metrics, retrieving risks and catalysts, then synthesizing bull/bear
            cases. This usually takes 30–90 seconds.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-slate-600">
          The pipeline runs automatically: metrics → qualitative retrieval → synthesis →
          citations. Optionally add a focus below for the next run.
        </p>
        <textarea
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="Optional focus for this run (e.g. regulatory risk, margin trends)…"
          value={focusQuestion}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFocusQuestion(e.target.value)
          }
          rows={2}
          disabled={isAnalyzing}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          onClick={() => runAnalysis()}
          disabled={isAnalyzing || documentIds.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Run analysis again"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
