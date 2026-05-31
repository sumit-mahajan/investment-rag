"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the dashboard while any document is still processing */
export function DocumentIngestPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
