import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/lib/__tests__/utils/render";
import { DocumentUploader } from "../document-uploader";
import { createMockFile } from "@/lib/__tests__/utils/test-data";
import { toast } from "sonner";

vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

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
    expect(screen.getByText(/PDF files only/)).toBeInTheDocument();
    expect(screen.getByText(/Multiple files supported/)).toBeInTheDocument();
  });

  it("displays file input element", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", "application/pdf");
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("toasts error for non-PDF files", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("test.txt", "text/plain");
    const fileList = Object.assign([file], {
      length: 1,
      item: (i: number) => (i === 0 ? file : null),
    });

    Object.defineProperty(fileInput, "files", { value: fileList, writable: false });
    fireEvent.change(fileInput);

    expect(toast.error).toHaveBeenCalledWith("test.txt: Only PDF files are allowed");
    expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
  });

  it("toasts error for files exceeding size limit", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile("large.pdf", "application/pdf", 60 * 1024 * 1024);
    const fileList = Object.assign([largeFile], {
      length: 1,
      item: (i: number) => (i === 0 ? largeFile : null),
    });

    Object.defineProperty(fileInput, "files", { value: fileList, writable: false });
    fireEvent.change(fileInput);

    expect(toast.error).toHaveBeenCalledWith("large.pdf: File size must be less than 50MB");
  });

  it("accepts valid PDF file and shows upload button", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile("document.pdf", "application/pdf", 1024000);
    const fileList = Object.assign([validFile], {
      length: 1,
      item: (i: number) => (i === 0 ? validFile : null),
    });

    Object.defineProperty(fileInput, "files", { value: fileList, writable: false });
    fireEvent.change(fileInput);

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeInTheDocument();
  });

  it("allows removing selected file", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile("document.pdf", "application/pdf");
    const fileList = Object.assign([validFile], {
      length: 1,
      item: (i: number) => (i === 0 ? validFile : null),
    });

    Object.defineProperty(fileInput, "files", { value: fileList, writable: false });
    fireEvent.change(fileInput);
    expect(screen.getByText("document.pdf")).toBeInTheDocument();

    const removeButton = screen
      .getAllByRole("button")
      .find((btn) => !btn.textContent?.includes("Upload"));
    expect(removeButton).toBeDefined();
    fireEvent.click(removeButton!);

    expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
  });

  it("displays file size in MB", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("document.pdf", "application/pdf", 2048000);
    const fileList = Object.assign([file], {
      length: 1,
      item: (i: number) => (i === 0 ? file : null),
    });

    Object.defineProperty(fileInput, "files", { value: fileList, writable: false });
    fireEvent.change(fileInput);

    expect(screen.getByText(/1.95 MB/)).toBeInTheDocument();
  });

  it("adds valid file after invalid file was rejected", () => {
    render(<DocumentUploader />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const invalidFile = createMockFile("test.txt", "text/plain");
    Object.defineProperty(
      fileInput,
      "files",
      {
        value: Object.assign([invalidFile], {
          length: 1,
          item: (i: number) => (i === 0 ? invalidFile : null),
        }),
        writable: false,
        configurable: true,
      }
    );
    fireEvent.change(fileInput);
    expect(toast.error).toHaveBeenCalled();

    const validFile = createMockFile("document.pdf", "application/pdf");
    Object.defineProperty(
      fileInput,
      "files",
      {
        value: Object.assign([validFile], {
          length: 1,
          item: (i: number) => (i === 0 ? validFile : null),
        }),
        writable: false,
        configurable: true,
      }
    );
    fireEvent.change(fileInput);

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });
});
