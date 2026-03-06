import pdfParse from "pdf-parse";
import { ProcessingError } from "@/lib/utils/errors";
import { isImageBasedPDF, extractTextFromImagePDF } from "./pdf-image-extractor";

export interface ParsedPDF {
  text: string;
  numPages: number;
  isImageBased: boolean;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
  };
  metadata: Record<string, any>;
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    const data = await pdfParse(buffer);

    let text = data.text;
    let imageBasedPDF = false;

    if (isImageBasedPDF(text, data.numpages)) {
      console.log(
        `PDF appears image-based (${data.numpages} pages, ${text.trim().length} chars extracted). ` +
          `Falling back to vision OCR...`
      );
      imageBasedPDF = true;
      text = await extractTextFromImagePDF(buffer, data.numpages);
      console.log(`Vision OCR extracted ${text.trim().length} chars from ${data.numpages} pages.`);
    }

    return {
      text,
      numPages: data.numpages,
      isImageBased: imageBasedPDF,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
      },
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new ProcessingError("Failed to parse PDF file");
  }
}

export interface DetectedHeading {
  text: string;
  startIndex: number;
  level: number; // 1 = main heading, 2 = subheading, etc.
}

/**
 * Detect headings in document text using generic patterns.
 * Works with any financial report format (10-K, annual reports, etc.)
 */
export function detectHeadings(text: string): DetectedHeading[] {
  const headings: DetectedHeading[] = [];

  // Pattern for numbered sections (e.g., "1. Business Overview", "Item 1", "Section A")
  const numberedPattern = /^(?:Item\s+\d+[A-Z]?|Section\s+\d+|Part\s+[IVX\d]+|\d+\.)\s*[A-Z][^\n]{5,80}$/gim;

  // Pattern for all-caps headings (common in financial reports)
  const capsPattern = /^[A-Z][A-Z\s\-]{10,60}$/gm;

  // Pattern for title-case headings followed by newline
  const titleCasePattern = /^(?:[A-Z][a-z]+(?:\s+(?:and|of|the|for|in|to|with|&|[A-Z][a-z]+))*){2,}\s*$/gm;

  const patterns = [
    { pattern: numberedPattern, level: 1 },
    { pattern: capsPattern, level: 1 },
    { pattern: titleCasePattern, level: 2 },
  ];

  for (const { pattern, level } of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        const headingText = match[0].trim();

        // Skip if too short or looks like TOC entry (ends with page number)
        if (headingText.length < 10) continue;
        if (/\d{1,3}\s*$/.test(headingText)) continue;

        // Check if this heading has substantial content after it
        const afterHeading = text.substring(
          match.index + match[0].length,
          match.index + match[0].length + 200
        );
        const hasContent = afterHeading.replace(/[\d\s\.\,\-]/g, "").length > 50;

        if (hasContent) {
          headings.push({
            text: headingText,
            startIndex: match.index,
            level,
          });
        }
      }
    }
  }

  // Sort by position and deduplicate overlapping headings
  headings.sort((a, b) => a.startIndex - b.startIndex);

  // Remove headings that are too close together (within 50 chars)
  const deduplicated: DetectedHeading[] = [];
  for (const heading of headings) {
    const lastHeading = deduplicated[deduplicated.length - 1];
    if (!lastHeading || heading.startIndex - lastHeading.startIndex > 50) {
      deduplicated.push(heading);
    }
  }

  return deduplicated;
}
