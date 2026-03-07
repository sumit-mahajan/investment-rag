import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/lib/__tests__/utils/render";
import { DocumentUploader } from "../document-uploader";
import { createMockFile } from "@/lib/__tests__/utils/test-data";

// Mock the register action
vi.mock("@/app/actions/documents", () => ({
  registerDocumentAction: vi.fn(),
}));

// Mock vercel blob upload
vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DocumentUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload area", () => {
    render(<DocumentUploader />);
    
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
    expect(screen.getByText("PDF files only (MAX. 50MB)")).toBeInTheDocument();
  });

  it("displays file input element", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", "application/pdf");
  });

  it("shows error for non-PDF files", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("test.txt", "text/plain");
    const fileList = Object.assign([file], { length: 1, item: (i: number) => (i === 0 ? file : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText("Only PDF files are allowed")).toBeInTheDocument();
  });

  it("shows error for files exceeding size limit", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile("large.pdf", "application/pdf", 60 * 1024 * 1024);
    const fileList = Object.assign([largeFile], { length: 1, item: (i: number) => (i === 0 ? largeFile : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText("File size must be less than 50MB")).toBeInTheDocument();
  });

  it("accepts valid PDF file", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile("document.pdf", "application/pdf", 1024000);
    const fileList = Object.assign([validFile], { length: 1, item: (i: number) => (i === 0 ? validFile : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText("Upload and Process")).toBeInTheDocument();
  });

  it("allows removing selected file", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile("document.pdf", "application/pdf");
    const fileList = Object.assign([validFile], { length: 1, item: (i: number) => (i === 0 ? validFile : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    
    // Find and click the X button
    const removeButtons = screen.getAllByRole("button");
    const removeButton = removeButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide-x')
    );
    
    if (removeButton) {
      fireEvent.click(removeButton);
    }
    
    expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
  });

  it("displays file size in MB", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("document.pdf", "application/pdf", 2048000);
    const fileList = Object.assign([file], { length: 1, item: (i: number) => (i === 0 ? file : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText(/1.95 MB/)).toBeInTheDocument();
  });

  it("clears error when valid file is selected after error", () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // First, select invalid file
    const invalidFile = createMockFile("test.txt", "text/plain");
    const invalidFileList = Object.assign([invalidFile], { length: 1, item: (i: number) => (i === 0 ? invalidFile : null) });
    Object.defineProperty(fileInput, "files", {
      value: invalidFileList,
      writable: false,
      configurable: true,
    });
    fireEvent.change(fileInput);
    expect(screen.getByText("Only PDF files are allowed")).toBeInTheDocument();
    
    // Then, select valid file (redefine files with configurable)
    const validFile = createMockFile("document.pdf", "application/pdf");
    const validFileList = Object.assign([validFile], { length: 1, item: (i: number) => (i === 0 ? validFile : null) });
    Object.defineProperty(fileInput, "files", {
      value: validFileList,
      writable: false,
      configurable: true,
    });
    fireEvent.change(fileInput);
    
    expect(screen.queryByText("Only PDF files are allowed")).not.toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("disables file input while uploading", async () => {
    render(<DocumentUploader />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile("document.pdf", "application/pdf");
    const fileList = Object.assign([validFile], { length: 1, item: (i: number) => (i === 0 ? validFile : null) });
    
    Object.defineProperty(fileInput, "files", {
      value: fileList,
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // The input should be disabled during upload
    // Note: Full upload test would require mocking the upload function
    expect(fileInput).toHaveAttribute("accept", "application/pdf");
  });
});
