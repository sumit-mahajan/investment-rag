# Investment RAG

An AI-powered app that analyzes any financial document (10-K filings, annual reports, quarterly reports, etc.) from any jurisdiction and provides insights based on your selected criteria.

---

## Quick Start (Run Locally)

### Prerequisites

You'll need accounts and API keys for:

- **Groq** - [Get free API key](https://console.groq.com) (for LLM)
- **Google AI** - [Get free API key](https://aistudio.google.com/apikey) (for embeddings)
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
GROQ_API_KEY=...
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
4. Optionally set `LANGCHAIN_TRACING_V2=true` to enable tracing (LangChain SDK will send traces to LangSmith when the key is present).

You can leave `LANGCHAIN_API_KEY` unset for a basic demo.

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
User uploads PDF → Parse & Chunk → Assign Categories → Generate Embeddings → Store
                                                                                ↓
User runs analysis ← LLM generates verdict ← Filter by Categories ← Retrieve chunks
```

### Supported Document Types

The app analyzes any financial report, including:

- **SEC Filings**: 10-K, 10-Q, 8-K (US)
- **Annual Reports**: From any jurisdiction (India, UK, EU, etc.)
- **Quarterly Reports**: Any format
- **Other Financial Documents**: Investor presentations, earnings reports

### Content Categories

Each chunk is automatically classified into one or more categories using keyword pattern matching:

| Category                | What It Captures                                              |
| ----------------------- | ------------------------------------------------------------- |
| `financial-performance` | Revenue, profit, margins, cash flow, balance sheet data       |
| `risk-factors`          | Business risks, uncertainties, threats, exposures             |
| `business-operations`   | Products, services, market position, operations               |
| `management-governance` | Leadership, board, compensation, governance practices         |
| `legal-regulatory`      | Legal proceedings, compliance, regulations, patents           |
| `strategy-outlook`      | Growth plans, acquisitions, R&D, future initiatives           |
| `general`               | Content that doesn't fit specific categories                  |

Categories enable **pre-filtering** during retrieval—when analyzing financial health, the system prioritizes `financial-performance` chunks; for risk assessment, it prioritizes `risk-factors` chunks.

### Key Components

#### 1. Document Processing Pipeline

When you upload a PDF:

1. **Parse**: Extract text from PDF using `pdf-parse`
2. **Detect Headings**: Find document structure (any format, not 10-K specific)
3. **Chunk**: Split into ~1500 token pieces with heading-aware boundaries
4. **Classify**: Assign categories to each chunk using keyword patterns
5. **Embed**: Convert chunks to 768-dimension vectors using Gemini embeddings
6. **Store**: Save vectors + categories in Pinecone, full data in PostgreSQL

#### 2. Two Databases (Why?)

| PostgreSQL                                                  | Pinecone                             |
| ----------------------------------------------------------- | ------------------------------------ |
| Stores structured data (users, documents, analysis results) | Stores vector embeddings             |
| Good for complex queries & relationships                    | Optimized for fast similarity search |
| Source of truth for chunk text and categories               | Finds semantically similar content   |

**Example**: When searching, Pinecone finds chunks that _mean_ the same thing as your query (even without exact keyword matches), then filters by category. PostgreSQL stores the full text and metadata.

#### 3. Retrieval (RAG)

When analyzing a document:

1. **Hybrid Search**: Combines vector similarity + keyword matching
2. **Category Filtering**: Pre-filters chunks by relevant categories
3. **LLM Analysis**: Groq Llama 3.3 70B analyzes chunks against your criteria

#### 4. Analysis Agent (LangGraph)

The analysis runs as a 3-step workflow:

```
Retrieve → Analyze → Synthesize
```

- **Retrieve**: Get relevant chunks (filtered by category)
- **Analyze**: LLM extracts insights per criterion
- **Synthesize**: Combine into final verdict with confidence score

### Analysis Criteria

The system evaluates documents against these criteria:

| Criterion              | Categories Used                         |
| ---------------------- | --------------------------------------- |
| Financial Health       | `financial-performance`                 |
| Risk Assessment        | `risk-factors`, `legal-regulatory`      |
| Growth Potential       | `strategy-outlook`, `business-operations` |
| Competitive Position   | `business-operations`, `strategy-outlook` |
| Management Quality     | `management-governance`                 |
| Regulatory Compliance  | `legal-regulatory`, `risk-factors`      |

### Project Structure

```
app/                    # Next.js pages & API routes
├── (auth)/            # Sign in/up pages (Clerk)
├── (dashboard)/       # Protected pages (dashboard, documents, analysis)
└── api/               # Backend endpoints

lib/
├── agents/            # LangGraph analysis workflow
│   └── nodes/         # Retrieve, analyze, synthesize nodes
├── db/                # Database schema (Drizzle ORM)
├── rag/
│   ├── chunking/      # Heading-aware document splitting
│   ├── embeddings/    # Gemini embedding generation
│   ├── metadata/      # Category classifier (keyword-based)
│   └── retrieval/     # Hybrid search with category filtering
├── parsers/           # PDF parsing, heading detection
├── services/          # Document processor, retrieval service
└── vectorstore/       # Pinecone operations

components/            # React UI components
config/
├── criteria.config.ts # Analysis criteria with category mappings
└── rag.config.ts      # Chunking, embedding, retrieval settings
```

### Cost Per Analysis

| Component                             | Cost         |
| ------------------------------------- | ------------ |
| Embeddings (Gemini, one-time per doc) | **FREE** ✨  |
| Analysis (Groq Llama 3.3 70B)         | **FREE** ✨  |
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
- **AI**: LangChain, LangGraph, Groq (Llama 3.3 70B), Google Gemini (embeddings)
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
