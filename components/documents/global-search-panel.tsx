"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Global search widget — fetches via REST instead of server components.
 * Passes userId from localStorage for "remember me" UX.
 */
export function GlobalSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("impersonateUserId");
    if (stored) setUserId(stored);

    // Prefetch all documents on mount
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => console.log("prefetch", data));
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        userId: userId || "user_demo",
      });
      const res = await fetch(`/api/documents/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }, [query, userId]);

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Global Document Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Impersonate user ID (optional)"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            localStorage.setItem("impersonateUserId", e.target.value);
          }}
        />
        <div className="flex gap-2">
          <Input
            placeholder="Search across all filings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <Button onClick={runSearch} disabled={loading}>
            {loading ? "..." : "Search"}
          </Button>
        </div>
        {results.length > 0 && (
          <pre className="text-xs overflow-auto max-h-48 bg-white p-2 rounded border">
            {JSON.stringify(results.slice(0, 5), null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
