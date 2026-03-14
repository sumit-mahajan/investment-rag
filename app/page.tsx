"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  TrendingUp,
  Shield,
  ArrowRight,
  Upload,
  Layers,
  Search,
  Sparkles,
  BarChart3,
  Target,
  Users,
  Scale,
  Globe,
  FileCheck,
} from "lucide-react";

const documentTypes = [
  "10-K, 10-Q, 8-K",
  "Annual Reports",
  "Quarterly Reports",
  "Investor Presentations",
  "Earnings Reports",
];

const howItWorksSteps = [
  {
    step: 1,
    icon: Upload,
    title: "Upload",
    description: "Drop any financial PDF—SEC filings, annual reports, or investor decks.",
  },
  {
    step: 2,
    icon: Layers,
    title: "Parse & Chunk",
    description: "We extract text, detect structure, and split into smart chunks with categories.",
  },
  {
    step: 3,
    icon: Search,
    title: "Retrieve",
    description: "Hybrid search finds relevant sections by meaning, filtered by your criteria.",
  },
  {
    step: 4,
    icon: Sparkles,
    title: "Analyze",
    description: "AI evaluates against your chosen criteria and delivers a verdict with citations.",
  },
];

const analysisCriteria = [
  {
    icon: BarChart3,
    name: "Financial Health",
    description: "Revenue growth, margins, cash flow, balance sheet strength",
  },
  {
    icon: Shield,
    name: "Risk Assessment",
    description: "Business, market, regulatory, and financial risks",
  },
  {
    icon: TrendingUp,
    name: "Growth Potential",
    description: "R&D, market expansion, innovation pipeline",
  },
  {
    icon: Target,
    name: "Competitive Position",
    description: "Market share, moats, differentiation, pricing power",
  },
  {
    icon: Users,
    name: "Management Quality",
    description: "Leadership, governance, compensation alignment",
  },
  {
    icon: Scale,
    name: "Regulatory Compliance",
    description: "Legal proceedings, compliance status, litigation risks",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Blue gradient background - ambient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-50/80 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 font-semibold tracking-tight"
          >
            <div className="p-1.5 rounded-lg bg-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="hidden xs:inline">Investment RAG</span>
            <span className="xs:hidden">IRAG</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm px-2 sm:px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-full px-3 sm:px-5 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8 opacity-0 animate-fade-in-up animation-delay-0">
            <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Any jurisdiction · Any format
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 mb-4 sm:mb-6 opacity-0 animate-fade-in-up animation-delay-100">
            AI-powered analysis for
            <br />
            <span className="text-blue-600">any financial report</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 opacity-0 animate-fade-in-up animation-delay-150 px-2">
            Upload 10-K filings, annual reports, quarterly reports, investor presentations—from any
            company, any jurisdiction. Get instant insights across 6 analysis criteria.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 sm:mb-10 opacity-0 animate-fade-in-up animation-delay-200 px-2">
            {documentTypes.map((type, i) => (
              <span
                key={type}
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-600 text-xs sm:text-sm border border-slate-200/80"
              >
                {type}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 opacity-0 animate-fade-in-up animation-delay-300 px-4 sm:px-0">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 h-11 sm:h-12 text-sm sm:text-base font-medium group"
              >
                Start Analyzing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 text-center mb-3 sm:mb-4">
          How it works
        </h2>
        <p className="text-sm sm:text-base text-slate-600 text-center max-w-xl mx-auto mb-10 sm:mb-16 px-2">
          From upload to verdict in four steps. RAG-powered retrieval ensures every insight is
          grounded in your document.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {howItWorksSteps.map(({ step, icon: Icon, title, description }, i) => (
            <div
              key={step}
              className={`relative flex flex-col p-4 sm:p-6 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-200/80 transition-all duration-300 opacity-0 animate-fade-in-up ${i === 0 ? "animation-delay-200" : i === 1 ? "animation-delay-300" : i === 2 ? "animation-delay-400" : "animation-delay-500"}`}
            >
              <div className="absolute -top-3 -left-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center">
                {step}
              </div>
              <div className="inline-flex p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 mb-3 sm:mb-4 w-fit">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">{title}</h3>
              <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">{description}</p>
              {i < howItWorksSteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-blue-200 -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How it helps - Analysis criteria */}
      <section className="bg-slate-50/80 border-y border-slate-200/60 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 text-center mb-3 sm:mb-4">
            How it helps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 text-center max-w-xl mx-auto mb-10 sm:mb-16 px-2">
            Choose your criteria. We analyze the document and return a scored verdict with
            citations—so you can verify every insight.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {analysisCriteria.map(({ icon: Icon, name, description }, i) => (
              <div
                key={name}
                className={`group flex gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all duration-300 opacity-0 animate-fade-in-up ${["animation-delay-300", "animation-delay-400", "animation-delay-500", "animation-delay-600", "animation-delay-700", "animation-delay-800"][i]}`}
              >
                <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-0.5 sm:mb-1">{name}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - technical highlights */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 text-center mb-3 sm:mb-4">
          Built for financial documents
        </h2>
        <p className="text-sm sm:text-base text-slate-600 text-center max-w-xl mx-auto mb-10 sm:mb-16 px-2">
          Smart chunking, category-aware retrieval, and source citations—so your analysis is both
          comprehensive and verifiable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: FileText,
              title: "Smart Chunking",
              description:
                "Heading-aware splitting preserves document structure. Each chunk is classified into categories for targeted retrieval.",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: Search,
              title: "Category Filtering",
              description:
                "When analyzing financial health, we prioritize financial-performance chunks. For risks, we focus on risk-factors. Precision by design.",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: FileCheck,
              title: "Source Citations",
              description:
                "Every insight includes page citations. Verify findings in the original document—no black box.",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map(({ icon: Icon, title, description, color, bg }, i) => (
            <div
              key={title}
              className={`group relative p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200/80 hover:shadow-lg hover:shadow-blue-50/50 transition-all duration-300 opacity-0 animate-fade-in-up ${i === 0 ? "animation-delay-400" : i === 1 ? "animation-delay-500" : "animation-delay-600"}`}
            >
              <div
                className={`inline-flex p-2 sm:p-2.5 rounded-xl ${bg} ${color} mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">{title}</h3>
              <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 sm:px-8 py-10 sm:py-16 text-center opacity-0 animate-fade-in-up animation-delay-500">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="relative">
            <p className="text-blue-100 text-xs sm:text-sm font-medium mb-2">100% free within tier limits</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 sm:mb-3">
              Ready to analyze?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Create a free account. Upload a document. Get insights in minutes.
            </p>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-full px-6 sm:px-8 bg-white text-blue-600 hover:bg-blue-50 h-10 sm:h-12 text-sm sm:text-base font-medium"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-6 sm:py-8 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-slate-500">© 2026 Investment RAG</p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500">
            <span className="hidden xs:inline">Next.js · LangChain · Pinecone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
