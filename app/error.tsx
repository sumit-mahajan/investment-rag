"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-200 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-rose-100">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-slate-600 text-sm">
                We encountered an unexpected error. Please try again.
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded overflow-auto max-h-40">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3 w-full pt-2">
              <Button
                onClick={reset}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
