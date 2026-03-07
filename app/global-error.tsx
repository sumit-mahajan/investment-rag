"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-rose-200 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-rose-100">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-slate-600 text-sm">
                    An unexpected error occurred. Our team has been notified.
                  </p>
                  {error.digest && (
                    <p className="text-xs text-slate-500 mt-2">
                      Error ID: {error.digest}
                    </p>
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
      </body>
    </html>
  );
}
