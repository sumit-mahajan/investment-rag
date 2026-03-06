"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Subtle gradient orbs - ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-72 h-72 bg-slate-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl" />
      </div>

      {/* Navbar - minimal */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 font-semibold tracking-tight">
            <FileText className="h-5 w-5 text-slate-600" />
            Investment RAG
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-full px-5 bg-slate-900 hover:bg-slate-800">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 mb-6 opacity-0 animate-fade-in-up animation-delay-0">
            AI-powered analysis for
            <br />
            <span className="text-slate-600">financial documents</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up animation-delay-150">
            Upload 10-K filings and get instant, comprehensive analysis. RAG-powered insights to
            make better investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 opacity-0 animate-fade-in-up animation-delay-300">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-full px-8 bg-slate-900 hover:bg-slate-800 h-12 text-base font-medium group"
              >
                Start Analyzing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: FileText,
              title: "Smart Processing",
              description:
                "Advanced chunking and embedding optimized for financial documents. Preserves tables and structure.",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: TrendingUp,
              title: "Comprehensive Analysis",
              description:
                "Financial health, risks, growth potential, competitive position—all with AI-powered insights.",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: Shield,
              title: "Source Citations",
              description:
                "Every insight includes page citations so you can verify findings in the original document.",
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map(({ icon: Icon, title, description, color, bg }, i) => (
            <div
              key={title}
              className={`group relative p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 opacity-0 animate-fade-in-up ${i === 0 ? "animation-delay-400" : i === 1 ? "animation-delay-500" : "animation-delay-600"}`}
            >
              <div
                className={`inline-flex p-2.5 rounded-xl ${bg} ${color} mb-4 transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-[15px] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA - minimal */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 px-8 py-16 text-center opacity-0 animate-fade-in-up animation-delay-700">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create a free account and start analyzing financial documents in minutes.
            </p>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-full px-8 bg-white text-slate-900 hover:bg-slate-100 h-12 text-base font-medium"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - minimal */}
      <footer className="border-t border-slate-200/60 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© 2026 Investment RAG</p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="hidden sm:inline">Next.js · LangChain · Pinecone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
