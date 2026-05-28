"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the analysis detail page while status is running */
export function AnalysisStatusPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
