"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
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
                Unable to load dashboard
              </h2>
              <p className="text-slate-600">
                We encountered an error while loading your dashboard. This might be a
                temporary issue.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="w-full text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 mb-2">
                  Technical details (development mode)
                </summary>
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg overflow-auto max-h-48 font-mono">
                  <div className="font-semibold mb-1">Error: {error.name}</div>
                  <div>{error.message}</div>
                  {error.digest && (
                    <div className="mt-2 text-slate-500">Digest: {error.digest}</div>
                  )}
                </div>
              </details>
            )}
            <div className="flex gap-3 w-full pt-3">
              <Button
                onClick={reset}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
