import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/lib/__tests__/utils/render";
import { DocumentList } from "../document-list";
import { createMockDocumentListItem } from "@/lib/__tests__/utils/test-data";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the delete action
vi.mock("@/app/actions/documents", () => ({
  deleteDocumentAction: vi.fn(),
}));

import { deleteDocumentAction } from "@/app/actions/documents";

describe("DocumentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
  });

  it("renders empty state when no documents", () => {
    render(<DocumentList documents={[]} />);
    
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(screen.getByText(/Upload your first financial document/)).toBeInTheDocument();
  });

  it("renders document list with multiple documents", () => {
    const documents = [
      createMockDocumentListItem({ id: "1", companyName: "Apple Inc" }),
      createMockDocumentListItem({ id: "2", companyName: "Microsoft Corp" }),
    ];
    
    render(<DocumentList documents={documents} />);
    
    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
    expect(screen.getByText("Microsoft Corp")).toBeInTheDocument();
  });

  it("displays document metadata correctly", () => {
    const document = createMockDocumentListItem({
      companyName: "Test Company",
      originalName: "10-K-2023.pdf",
      fileSize: 2048000,
      totalChunks: 75,
    });
    
    render(<DocumentList documents={[document]} />);
    
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("10-K-2023.pdf")).toBeInTheDocument();
    expect(screen.getByText(/75 chunks/)).toBeInTheDocument();
  });

  it("shows correct status badge for completed documents", () => {
    const document = createMockDocumentListItem({ status: "completed" });
    
    render(<DocumentList documents={[document]} />);
    
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Analyze")).toBeInTheDocument();
  });

  it("shows correct status badge for processing documents", () => {
    const document = createMockDocumentListItem({ status: "processing" });
    
    render(<DocumentList documents={[document]} />);
    
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("shows correct status badge for failed documents", () => {
    const document = createMockDocumentListItem({ status: "failed" });
    
    render(<DocumentList documents={[document]} />);
    
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows analyze button only for completed documents", () => {
    const documents = [
      createMockDocumentListItem({ id: "1", status: "completed" }),
      createMockDocumentListItem({ id: "2", status: "processing" }),
    ];
    
    render(<DocumentList documents={documents} />);
    
    const analyzeButtons = screen.getAllByRole("link", { name: /Analyze/ });
    expect(analyzeButtons).toHaveLength(1);
  });

  it("calls delete action on delete button click with confirmation", async () => {
    const document = createMockDocumentListItem({ id: "doc-123" });
    const mockDeleteAction = vi.mocked(deleteDocumentAction);
    mockDeleteAction.mockResolvedValue({ 
      success: true, 
      data: { message: "Document deleted" } 
    });
    
    render(<DocumentList documents={[document]} />);
    
    const deleteButtons = screen.getAllByRole("button").filter(
      btn => btn.querySelector('svg')?.classList.toString().includes('lucide-trash')
    );
    
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith("doc-123");
      expect(toast.success).toHaveBeenCalledWith("Document deleted");
    });
  });

  it("does not call delete action if user cancels confirmation", async () => {
    global.confirm = vi.fn(() => false);
    const document = createMockDocumentListItem({ id: "doc-123" });
    const mockDeleteAction = vi.mocked(deleteDocumentAction);
    
    render(<DocumentList documents={[document]} />);
    
    const deleteButtons = screen.getAllByRole("button").filter(
      btn => btn.querySelector('svg')?.classList.toString().includes('lucide-trash')
    );
    
    fireEvent.click(deleteButtons[0]);
    
    expect(mockDeleteAction).not.toHaveBeenCalled();
  });

  it("shows error toast on delete failure", async () => {
    const document = createMockDocumentListItem({ id: "doc-123" });
    const mockDeleteAction = vi.mocked(deleteDocumentAction);
    mockDeleteAction.mockResolvedValue({ 
      success: false, 
      error: "Delete failed" 
    });
    
    render(<DocumentList documents={[document]} />);
    
    const deleteButtons = screen.getAllByRole("button").filter(
      btn => btn.querySelector('svg')?.classList.toString().includes('lucide-trash')
    );
    
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  it("disables delete button while deleting", async () => {
    const document = createMockDocumentListItem({ id: "doc-123" });
    const mockDeleteAction = vi.mocked(deleteDocumentAction);
    mockDeleteAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ 
        success: true, 
        data: { message: "Deleted" } 
      }), 100))
    );
    
    render(<DocumentList documents={[document]} />);
    
    const deleteButtons = screen.getAllByRole("button").filter(
      btn => btn.querySelector('svg')?.classList.toString().includes('lucide-trash')
    );
    
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(deleteButtons[0]).toBeDisabled();
    });
  });
});
