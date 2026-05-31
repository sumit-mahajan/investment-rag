# Investment RAG

An AI-powered app that ingests financial PDFs (10-K, annual reports, etc.) and produces structured investment analysis with cited metrics and bull/bear verdicts.

---

## Quick Start (Run Locally)

### Prerequisites

You'll need accounts and API keys for:

- **Google AI** - [Get free API key](https://aistudio.google.com/apikey) (for embeddings + LLM)
- **Pinecone** - [Sign up free](https://pinecone.io)
- **Clerk** - [Sign up free](https://clerk.com)
- **PostgreSQL** - Use [Vercel Postgres](https://vercel.com/storage/postgres) or [Neon](https://neon.tech)
- **Vercel Blob** - [Vercel Dashboard](https://vercel.com/dashboard) → Storage (for document uploads)
- **LangSmith** (optional) - [smith.langchain.com](https://smith.langchain.com) (for tracing/debugging RAG and agents)

### Step 1: Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 2: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
# Required
GOOGLE_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=investment-rag
POSTGRES_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
BLOB_READ_WRITE_TOKEN=...

# Optional (for webhook sync)
CLERK_WEBHOOK_SECRET=whsec_...
LANGCHAIN_API_KEY=...
```

#### Vercel Blob Storage (required for document uploads)

The app stores uploaded PDFs in [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). You need a Blob store and `BLOB_READ_WRITE_TOKEN`:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → select your project (or create one) → **Storage** tab.
2. Click **Create Database** → choose **Blob**.
3. Name the store (e.g. `investment-rag-blob`), set access to **Public** (so document URLs work), then create.
4. After creation, Vercel adds `BLOB_READ_WRITE_TOKEN` to the project. For **local dev**, pull env vars:
   ```bash
   vercel link    # link this repo to your Vercel project if needed
   vercel env pull .env.local
   ```
   Or copy the token from **Storage** → your Blob store → **Settings** and set `BLOB_READ_WRITE_TOKEN` in `.env.local`.

Without this token, document uploads will fail.

#### LangChain / LangSmith (optional)

[LangSmith](https://smith.langchain.com) provides tracing and debugging for the RAG pipeline and analysis agent (LangGraph). Useful for development, not required to run the app.

1. Sign up at [smith.langchain.com](https://smith.langchain.com).
2. Go to **Settings** → **API Keys** → **Create API Key**.
3. Copy the key and set in `.env.local`:
   ```env
   LANGCHAIN_API_KEY=lsv2_...
   ```
4. Enable tracing and RAGAS evaluation scripts:
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_PROJECT=investment-rag
   ```
5. Optional: `SHOW_LANGSMITH_TRACE=true` to show trace links in the analysis UI (developer-only).

You can leave `LANGCHAIN_API_KEY` unset for a basic demo without tracing.

### Step 3: Set Up Database

```bash
npm run db:push
```

### Step 4: Initialize Pinecone Index

```bash
npm run init:pinecone
```

### Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to Production (Vercel)

### Option 1: One-Click Deploy

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy

### Option 2: CLI Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Post-Deployment

1. **Set up Clerk Webhook**: In Clerk Dashboard, add webhook endpoint `https://your-domain.com/api/webhooks/clerk` with events: `user.created`, `user.updated`, `user.deleted`

2. **Verify**: Test document upload and analysis

---

## How It Works

### Overview

```
Client uploads PDF → Vercel Blob → Register + ingest (LlamaParse → chunk → embed → Pinecone)
                                                                              ↓
User runs analysis ← 4-node LangGraph (metrics → qualitative RAG → synthesis → citations)
                                                                              ↓
                                    Postgres stores analysis result + optional conversation
```

### Supported documents

- SEC filings (10-K, 10-Q), annual/quarterly reports (US, India, EU, etc.)
- Investor presentations and earnings materials (PDF)

### Ingestion

1. **LlamaParse** — page-aware prose + markdown tables
2. **Chunk** — prose/table chunks with `pageNumber`, `chunkType`
3. **Embed** — Gemini `gemini-embedding-001` (768d)
4. **Upsert** — Pinecone namespace = `userId`; doc registry in vector metadata

### Data stores

| Postgres (`analyses`, `conversations`) | Pinecone |
| -------------------------------------- | -------- |
| Saved analysis JSON, chat history      | Chunks + embeddings; doc list via metadata |

### Analysis (LangGraph)

```
metricExtraction → qualitativeRetrieval → synthesis → citationAssembly
```

Dense retrieval scoped by `fileId`. Gemini Flash produces verdict, bull/bear, metrics, and risks with page citations.

### Project structure

```
app/                 # Next.js App Router + API routes
lib/
├── ingestion/       # parse → chunk → embed → upsert
├── retrieval/       # Pinecone vector query
├── agents/          # LangGraph graph + nodes
├── services/        # Document, analysis, conversation
├── repositories/    # analyses + conversations (Drizzle)
└── vectorstore/     # Pinecone client
components/          # React UI
```

### Cost Per Analysis

| Component                             | Cost         |
| ------------------------------------- | ------------ |
| Embeddings (Gemini, one-time per doc) | **FREE** ✨  |
| Analysis (Gemini Flash)               | **FREE** ✨  |
| **Total**                             | **$0.00** 🎉 |

_100% free within generous tier limits (1000s of requests/day)_

---

## Available Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start development server        |
| `npm run build`         | Build for production            |
| `npm run db:push`       | Push schema to database         |
| `npm run db:studio`     | Open Drizzle Studio (DB viewer) |
| `npm run init:pinecone` | Create Pinecone index           |

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Auth**: Clerk
- **Database**: PostgreSQL (Drizzle ORM)
- **Vector DB**: Pinecone
- **AI**: LangChain, LangGraph, LlamaParse, Google Gemini (embeddings + Flash LLM), LangSmith (optional)
- **Deployment**: Vercel

---

## Troubleshooting

**Dependencies won't install?**

```bash
npm install --legacy-peer-deps
```

**Database connection error?**

- Check `POSTGRES_URL` is correct
- Ensure your IP is whitelisted if using external DB

**Document stuck processing?**

- Check terminal logs for errors
- Verify API key has credits

**Analysis fails?**

- Ensure document finished processing first
- Check API limits

---

## License

MIT
