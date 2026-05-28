# Known issues / deferred fixes

## Analysis (Groq)

- **Rate limits:** Free-tier Groq TPD can block synthesis and metric extraction. Re-run analyses after quota resets.
- **Metric quality:** Some runs still mis-label FCF/debt or show `0.0` placeholders; re-run after prompt/validation updates.
- **Legacy analyses:** Rows created before `sourcesUsed` / verdict UI lack new fields until re-analyzed.

## LangSmith / RAGAS

- Enable tracing for evaluation scripts: `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT=investment-rag`.
- `scripts/evaluate-rag.ts` loads cases from traces via `lib/evaluation/langsmith-loader.ts` (4-node graph state).
- Trace link in UI only when `SHOW_LANGSMITH_TRACE=true` (developer-only).

## Ingestion

- Register route awaits LlamaParse + embed + Pinecone (often 1–3 min). Large PDFs may approach the 300s API limit on Vercel.
- **Legacy Pinecone metadata:** Vectors with old `documentId` keys need re-ingest (`fileId`, `fileName`, `blobUrl`, `chunkType`).
