import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/lib/__tests__/utils/render";
import { CriteriaSelector } from "../criteria-selector";

describe("CriteriaSelector", () => {
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    mockOnAnalyze.mockClear();
  });

  it("renders with default selected criteria", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    expect(screen.getByText("Select Analysis Criteria")).toBeInTheDocument();
    expect(screen.getByText(/Choose which aspects/)).toBeInTheDocument();
  });

  it("displays all available criteria", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    // Check for some expected criteria names
    expect(screen.getByText("Financial Health")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Growth Potential")).toBeInTheDocument();
  });

  it("shows count of selected criteria in button", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    // Default has 3 criteria selected
    expect(screen.getByText("Run Analysis (3 criteria)")).toBeInTheDocument();
  });

  it("toggles criterion selection on click", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    const financialHealthButton = screen.getByText("Financial Health").closest("button");
    expect(financialHealthButton).toHaveClass("border-blue-200");
    
    // Click to deselect
    if (financialHealthButton) {
      fireEvent.click(financialHealthButton);
    }
    
    // Count should decrease
    expect(screen.getByText("Run Analysis (2 criteria)")).toBeInTheDocument();
  });

  it("calls onAnalyze with selected criteria IDs", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    const analyzeButton = screen.getByText(/Run Analysis/);
    fireEvent.click(analyzeButton);
    
    expect(mockOnAnalyze).toHaveBeenCalledWith(
      expect.arrayContaining(["financial-health", "risk-assessment", "growth-potential"])
    );
  });

  it("disables button when no criteria selected", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    // Deselect the 3 default criteria by clicking each
    fireEvent.click(screen.getByText("Financial Health").closest("button")!);
    fireEvent.click(screen.getByText("Risk Assessment").closest("button")!);
    fireEvent.click(screen.getByText("Growth Potential").closest("button")!);
    
    const analyzeButton = screen.getByText(/Run Analysis/);
    expect(analyzeButton).toBeDisabled();
    expect(screen.getByText("Select at least one criterion to continue")).toBeInTheDocument();
  });

  it("disables button when isAnalyzing is true", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={true} />);
    
    const analyzeButton = screen.getByText("Analyzing...");
    expect(analyzeButton).toBeDisabled();
  });

  it("does not call onAnalyze when no criteria selected", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    // Deselect the 3 default criteria by clicking each
    fireEvent.click(screen.getByText("Financial Health").closest("button")!);
    fireEvent.click(screen.getByText("Risk Assessment").closest("button")!);
    fireEvent.click(screen.getByText("Growth Potential").closest("button")!);
    
    const analyzeButton = screen.getByText(/Run Analysis/);
    fireEvent.click(analyzeButton);
    
    expect(mockOnAnalyze).not.toHaveBeenCalled();
  });

  it("updates button text based on criteria count", () => {
    render(<CriteriaSelector onAnalyze={mockOnAnalyze} isAnalyzing={false} />);
    
    // Start with 3 selected
    expect(screen.getByText("Run Analysis (3 criteria)")).toBeInTheDocument();
    
    // Add one more
    const managementQualityButton = screen.getByText("Management Quality").closest("button");
    if (managementQualityButton) {
      fireEvent.click(managementQualityButton);
    }
    
    expect(screen.getByText("Run Analysis (4 criteria)")).toBeInTheDocument();
  });
});
