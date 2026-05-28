# Features

## Stack (locked)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router, TypeScript |
| Auth | Clerk |
| PDF parsing | LlamaParse (`LLAMA_CLOUD_API_KEY`) |
| Embeddings | Gemini `gemini-embedding-001`, 768d, free tier |
| Vector store | Pinecone — dense index only, cosine metric, one namespace per user |
| LLM | Groq `llama-3.3-70b-versatile` via `@langchain/groq` |
| Orchestration | LangGraph `@langchain/langgraph` ^0.2 |
| File storage | Vercel Blob (PDFs only) |
| Database | Vercel Postgres / Drizzle — **two tables only**: `analyses`, `conversations` |
| Tracing | LangSmith — trace URL for developers (`SHOW_LANGSMITH_TRACE=true`) |

**What is not here:** Cohere, reranking, hybrid/keyword search, Postgres document registry, pdf-parse, criteria loops, philosophy nodes.

---

## CORE (must work perfectly)

### Feature 1 — Multi-file upload with chunk identity ✅

Each chunk upserted to Pinecone carries: `fileId`, `fileName`, `blobUrl`, `pageNumber`, `content`, `chunkType`, `userId`.

### Feature 2 — Citations in output ✅

Citations from Pinecone metadata (`fileName`, `pageNumber`, `fileId`, `blobUrl`). Clickable links open PDF at page via `/api/documents/[id]/view`.

### Feature 3 — Table and numerical data handling ✅

LlamaParse — tables as markdown chunks (`chunkType: "table"`), prose separate.

### Feature 4 — Structured investment analysis via 4-node LangGraph pipeline ✅

Output: `verdict` (score 0–100, recommendation, summary), bull/bear, key metrics, key risks.

Pipeline: metricExtraction → qualitativeRetrieval → synthesis → citationAssembly.

---

## GOOD TO HAVE

### Feature 5 — Conversation memory ✅

Follow-up chat on completed analysis pages. Messages persisted to `conversations` table. Answers use prior report + fresh retrieval scoped to analysis documents.

API: `GET/POST /api/analyses/[id]/chat`

### Feature 6 — Source attribution UI ✅

`sourcesUsed` on each analysis: documents, pages, and sections (metrics / qualitative) retrieved. Shown on analysis detail page with clickable page links.

### Feature 7 — LangSmith trace link ✅

Stored in `analyses.traceUrl`. Shown only when `SHOW_LANGSMITH_TRACE=true` (developer org access).

---

## NOT IN SCOPE

- Cross-document comparison
- General free-form Q&A outside an analysis context
