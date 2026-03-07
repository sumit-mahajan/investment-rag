import { describe, it, expect } from "vitest";
import { render, screen } from "@/lib/__tests__/utils/render";
import { AnalysisResults } from "../analysis-results";

describe("AnalysisResults", () => {
  const mockAnalysis = {
    verdict: "POSITIVE",
    confidenceScore: "0.85",
    summary: "The company demonstrates strong financial health with consistent revenue growth.",
    results: [
      {
        criterionName: "Financial Health",
        score: 0.9,
        findings: "Strong revenue growth of 25% year-over-year with healthy profit margins.",
      },
      {
        criterionName: "Risk Assessment",
        score: 0.6,
        findings: "Moderate risk level with some exposure to market volatility.",
      },
      {
        criterionName: "Growth Potential",
        score: 0.85,
        findings: "High growth potential in emerging markets.",
      },
    ],
  };

  it("renders overall verdict section", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Overall Verdict")).toBeInTheDocument();
    expect(screen.getByText("POSITIVE")).toBeInTheDocument();
  });

  it("displays confidence score as percentage", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Confidence Score:")).toBeInTheDocument();
    expect(screen.getAllByText("85%").length).toBeGreaterThanOrEqual(1);
  });

  it("displays summary text", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText(/strong financial health/)).toBeInTheDocument();
  });

  it("renders detailed analysis section when results exist", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Detailed Analysis")).toBeInTheDocument();
  });

  it("displays all criterion results", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Financial Health")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Growth Potential")).toBeInTheDocument();
  });

  it("displays scores as percentages", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("60%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("85%").length).toBeGreaterThanOrEqual(1);
  });

  it("displays findings for each criterion", () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    
    expect(screen.getByText(/Strong revenue growth of 25%/)).toBeInTheDocument();
    expect(screen.getByText(/Moderate risk level/)).toBeInTheDocument();
    expect(screen.getByText(/High growth potential/)).toBeInTheDocument();
  });

  it("renders NEGATIVE verdict correctly", () => {
    const negativeAnalysis = {
      ...mockAnalysis,
      verdict: "NEGATIVE",
    };
    
    render(<AnalysisResults analysis={negativeAnalysis} />);
    
    expect(screen.getByText("NEGATIVE")).toBeInTheDocument();
  });

  it("renders MIXED verdict correctly", () => {
    const mixedAnalysis = {
      ...mockAnalysis,
      verdict: "MIXED",
    };
    
    render(<AnalysisResults analysis={mixedAnalysis} />);
    
    expect(screen.getByText("MIXED")).toBeInTheDocument();
  });

  it("renders NEUTRAL verdict correctly", () => {
    const neutralAnalysis = {
      ...mockAnalysis,
      verdict: "NEUTRAL",
    };
    
    render(<AnalysisResults analysis={neutralAnalysis} />);
    
    expect(screen.getByText("NEUTRAL")).toBeInTheDocument();
  });

  it("handles missing verdict gracefully", () => {
    const noVerdictAnalysis = {
      ...mockAnalysis,
      verdict: null,
    };
    
    render(<AnalysisResults analysis={noVerdictAnalysis} />);
    
    expect(screen.getByText("Overall Verdict")).toBeInTheDocument();
    expect(screen.queryByText("POSITIVE")).not.toBeInTheDocument();
  });

  it("handles missing confidence score gracefully", () => {
    const noConfidenceAnalysis = {
      ...mockAnalysis,
      confidenceScore: null,
    };
    
    render(<AnalysisResults analysis={noConfidenceAnalysis} />);
    
    expect(screen.queryByText("Confidence Score:")).not.toBeInTheDocument();
  });

  it("handles empty results array", () => {
    const emptyResultsAnalysis = {
      ...mockAnalysis,
      results: [],
    };
    
    render(<AnalysisResults analysis={emptyResultsAnalysis} />);
    
    expect(screen.queryByText("Detailed Analysis")).not.toBeInTheDocument();
  });

  it("handles missing results", () => {
    const noResultsAnalysis = {
      verdict: "POSITIVE",
      summary: "Test summary",
    };
    
    render(<AnalysisResults analysis={noResultsAnalysis} />);
    
    expect(screen.getByText("Overall Verdict")).toBeInTheDocument();
    expect(screen.queryByText("Detailed Analysis")).not.toBeInTheDocument();
  });

  it("applies correct color scheme for high scores (>= 70%)", () => {
    const highScoreAnalysis = {
      ...mockAnalysis,
      results: [
        {
          criterionName: "Financial Health",
          score: 0.9,
          findings: "Excellent performance",
        },
      ],
    };
    
    render(<AnalysisResults analysis={highScoreAnalysis} />);
    
    const badge = screen.getByText("90%");
    expect(badge).toHaveClass("text-emerald-700");
  });

  it("applies correct color scheme for medium scores (50-70%)", () => {
    const mediumScoreAnalysis = {
      ...mockAnalysis,
      results: [
        {
          criterionName: "Risk Assessment",
          score: 0.6,
          findings: "Moderate performance",
        },
      ],
    };
    
    render(<AnalysisResults analysis={mediumScoreAnalysis} />);
    
    const badge = screen.getByText("60%");
    expect(badge).toHaveClass("text-amber-700");
  });

  it("applies correct color scheme for low scores (< 50%)", () => {
    const lowScoreAnalysis = {
      ...mockAnalysis,
      results: [
        {
          criterionName: "Risk Assessment",
          score: 0.3,
          findings: "Poor performance",
        },
      ],
    };
    
    render(<AnalysisResults analysis={lowScoreAnalysis} />);
    
    const badge = screen.getByText("30%");
    expect(badge).toHaveClass("text-rose-700");
  });
});
