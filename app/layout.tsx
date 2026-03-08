import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://investment-rag.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Investment RAG - AI-Powered Financial Document Analysis",
    template: "%s | Investment RAG",
  },
  description:
    "Upload 10-K filings, annual reports, quarterly reports, and investor presentations. Get instant AI-powered insights across financial health, risk assessment, growth potential, and more. Smart chunking, category-aware retrieval, and source citations.",
  keywords: [
    "financial document analysis",
    "10-K analysis",
    "SEC filings",
    "annual report",
    "AI investment research",
    "RAG",
    "document intelligence",
    "earnings report",
    "investor presentation",
  ],
  authors: [{ name: "Investment RAG" }],
  creator: "Investment RAG",
  publisher: "Investment RAG",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Investment RAG",
    title: "Investment RAG - AI-Powered Financial Document Analysis",
    description:
      "Upload financial documents and get instant AI-powered insights. Analyze 10-K filings, annual reports, and investor presentations across 6 criteria with source citations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investment RAG - AI-Powered Financial Document Analysis",
    description:
      "Upload financial documents and get instant AI-powered insights. Analyze 10-K filings, annual reports, and investor presentations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    // Add when you have them: google: "your-google-verification",
    // yandex: "your-yandex-verification",
  },
  category: "finance",
  appleWebApp: {
    capable: true,
    title: "Investment RAG",
    statusBarStyle: "default",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
