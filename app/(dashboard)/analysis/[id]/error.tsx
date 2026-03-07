"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AnalysisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Analysis error:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Card className="border-rose-200 bg-white shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="p-4 rounded-full bg-rose-100">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Analysis Error
              </h2>
              <p className="text-slate-600">
                We couldn't load this analysis page. The document might not exist or
                there was a problem processing your request.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="w-full text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 mb-2">
                  Error details (development mode)
                </summary>
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg overflow-auto max-h-48 font-mono">
                  {error.message}
                </div>
              </details>
            )}
            <div className="flex gap-3 w-full pt-3">
              <Button
                onClick={reset}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
