/**
 * OCR fallback for image-based PDFs (scanned documents, annual reports with embedded images).
 *
 * Uses pdftoppm (poppler-utils) to render each PDF page as a PNG, then sends
 * each image to the Groq vision model to extract text.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

const execAsync = promisify(exec);

/**
 * Number of page images to send to the vision LLM concurrently.
 * Keep low to respect Groq rate limits.
 */
const CONCURRENCY = 3;

/**
 * Resolution (DPI) for rendering PDF pages.
 * 150 DPI gives readable text without producing oversized images.
 */
const RENDER_DPI = 150;

let visionModel: ChatGroq | null = null;

function getVisionModel(): ChatGroq {
  if (!visionModel) {
    visionModel = new ChatGroq({
      model: "llama-3.2-11b-vision-preview",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return visionModel;
}

async function extractTextFromPageImage(
  imagePath: string,
  pageNum: number
): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString("base64");

  try {
    const model = getVisionModel();
    const response = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `This is page ${pageNum} of a financial document (annual report, SEC filing, or similar). Extract ALL visible text from this page exactly as it appears. Preserve the structure: headings, paragraphs, tables, numbers, and labels. For tables, maintain column alignment using spaces or pipes. Output only the extracted text with no commentary or explanation.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      }),
    ]);

    if (typeof response.content === "string") {
      return response.content;
    }
    return (response.content as Array<{ text?: string }>)
      .map((c) => c.text ?? "")
      .join("");
  } catch (error) {
    console.error(`OCR failed for page ${pageNum}:`, error);
    return "";
  }
}

async function renderPDFPages(pdfPath: string, outputDir: string, numPages: number): Promise<string[]> {
  const outputPrefix = path.join(outputDir, "page");
  await execAsync(
    `pdftoppm -png -r ${RENDER_DPI} -l ${numPages} "${pdfPath}" "${outputPrefix}"`
  );

  const files = await fs.readdir(outputDir);
  return files
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outputDir, f));
}

/**
 * Converts an image-based PDF to text using Groq vision OCR.
 *
 * Renders each page with pdftoppm, then sends each page image to the
 * Groq llama-3.2-11b-vision-preview model for text extraction.
 */
export async function extractTextFromImagePDF(
  pdfBuffer: Buffer,
  numPages: number
): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  const pagesDir = path.join(tempDir, "pages");

  try {
    await fs.writeFile(pdfPath, pdfBuffer);
    await fs.mkdir(pagesDir, { recursive: true });

    console.log(`Image-based PDF: rendering ${numPages} pages at ${RENDER_DPI} DPI...`);
    const imageFiles = await renderPDFPages(pdfPath, pagesDir, numPages);
    console.log(`Rendered ${imageFiles.length} page(s). Starting vision OCR...`);

    const pageTexts: { pageNum: number; text: string }[] = [];

    for (let i = 0; i < imageFiles.length; i += CONCURRENCY) {
      const batch = imageFiles.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((imagePath, batchIdx) => {
          const pageNum = i + batchIdx + 1;
          return extractTextFromPageImage(imagePath, pageNum).then((text) => ({
            pageNum,
            text,
          }));
        })
      );
      pageTexts.push(...batchResults);
      console.log(
        `OCR progress: ${Math.min(i + CONCURRENCY, imageFiles.length)}/${imageFiles.length} pages`
      );
    }

    pageTexts.sort((a, b) => a.pageNum - b.pageNum);
    return pageTexts.map((p) => p.text).join("\n\n");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Returns true when the extracted text is too sparse to be a proper text-layer PDF.
 *
 * Financial documents typically contain 500+ characters per page.
 * If the average falls below 200 chars/page, the PDF is almost certainly
 * image-based (scanned) and needs OCR.
 */
export function isImageBasedPDF(text: string, numPages: number): boolean {
  if (numPages === 0) return false;
  const avgCharsPerPage = text.replace(/\s+/g, " ").trim().length / numPages;
  return avgCharsPerPage < 200;
}
