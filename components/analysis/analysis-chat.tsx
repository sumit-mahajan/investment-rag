"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { ConversationMessage } from "@/lib/db/schema";

interface AnalysisChatProps {
  analysisId: string;
}

export function AnalysisChat({ analysisId }: AnalysisChatProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`);
      if (res.ok) {
        const data = (await res.json()) as { messages: ConversationMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, [analysisId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setInput("");

    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = (await res.json()) as {
        messages?: ConversationMessage[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      setMessages(data.messages ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Ask about this analysis
        </CardTitle>
        <p className="text-xs text-slate-500 font-normal">
          Follow-up questions use the completed report and fresh retrieval from the same
          documents.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          {!loaded && (
            <p className="text-xs text-slate-400 text-center py-4">Loading…</p>
          )}
          {loaded && messages.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">
              e.g. &quot;What drove operating margin change?&quot; or &quot;Summarize top
              risks in one paragraph&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.createdAt}-${i}`}
              className={`text-sm rounded-lg px-3 py-2 ${
                m.role === "user"
                  ? "bg-blue-100 text-blue-900 ml-4"
                  : "bg-white border border-slate-200 text-slate-700 mr-4"
              }`}
            >
              <span className="text-xs font-medium uppercase opacity-60 block mb-0.5">
                {m.role}
              </span>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask a follow-up question…"
            disabled={loading}
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
