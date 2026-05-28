import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisResults } from "../analysis-results";
import type { InvestmentAnalysis } from "@/lib/types/analysis";

const mockResult: InvestmentAnalysis = {
  verdict: {
    score: 72,
    recommendation: "buy",
    headline: "Solid profitability with manageable risk profile",
    summary:
      "Meta shows strong net income and free cash flow. Regulatory and platform risks remain material.",
  },
  bullCase: {
    points: ["Strong revenue growth driven by cloud segment."],
    citations: [],
  },
  bearCase: {
    points: ["Margin pressure from rising costs."],
    citations: [],
  },
  keyMetrics: [
    {
      label: "Revenue and YoY growth",
      value: "$394B, +8% YoY",
      citation: {
        documentName: "annual-report.pdf",
        pageNumber: 8,
        fileId: "550e8400-e29b-41d4-a716-446655440000",
      },
    },
    {
      label: "Forward Guidance",
      value: null,
      citation: null,
    },
  ],
  keyRisks: {
    points: ["Regulatory scrutiny in key markets."],
    citations: [],
  },
};

const mockDocuments = [
  {
    fileId: "550e8400-e29b-41d4-a716-446655440000",
    fileName: "annual-report.pdf",
    blobUrl: "https://blob.example/report.pdf",
  },
];

describe("AnalysisResults", () => {
  it("renders verdict score and recommendation", () => {
    render(<AnalysisResults result={mockResult} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText(/Solid profitability/)).toBeInTheDocument();
  });

  it("renders bull and bear sections", () => {
    render(<AnalysisResults result={mockResult} />);
    expect(screen.getByText("Bull Case")).toBeInTheDocument();
    expect(screen.getByText("Bear Case")).toBeInTheDocument();
    expect(screen.getByText(/Strong revenue growth/)).toBeInTheDocument();
  });

  it("renders key metrics without citation when value is null", () => {
    render(<AnalysisResults result={mockResult} documents={mockDocuments} />);
    expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    expect(screen.getByText(/\$394B/)).toBeInTheDocument();
    expect(screen.getByText(/Not found in uploaded documents/)).toBeInTheDocument();
    const citationLinks = screen.getAllByRole("link");
    expect(citationLinks.some((a) => a.getAttribute("href")?.includes("view?page=8"))).toBe(
      true
    );
  });

  it("shows developer LangSmith trace when provided", () => {
    render(
      <AnalysisResults
        result={mockResult}
        traceUrl="https://smith.langchain.com/o/-/projects/p/test/r/abc"
      />
    );
    expect(screen.getByText(/Developer: LangSmith trace/)).toBeInTheDocument();
  });

  it("shows error for invalid result shape", () => {
    render(<AnalysisResults result={{ error: "Pipeline failed" }} />);
    expect(screen.getByText(/Unable to display/)).toBeInTheDocument();
  });
});
