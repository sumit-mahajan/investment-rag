import LlamaCloud from "@llamaindex/llama-cloud";
import type { TableItem } from "@llamaindex/llama-cloud/resources/parsing";
import { getLlamaParseConfig } from "./config";
import type { ParsedPage } from "./types";

const MIN_PROSE_LENGTH = 20;

type MarkdownPage =
  | { success: true; page_number: number; markdown: string }
  | { success: false; page_number: number; error: string };

type StructuredPage =
  | {
      success: true;
      page_number: number;
      items: Array<{ type?: string; md?: string; value?: string; rows?: TableItem["rows"] }>;
    }
  | { success: false; page_number: number; error: string };

function rowsToMarkdown(rows: TableItem["rows"]): string {
  if (rows.length === 0) return "";
  const lines = rows.map((row) =>
    "| " + row.map((cell) => String(cell ?? "")).join(" | ") + " |"
  );
  if (lines.length >= 2) {
    const colCount = rows[0].length;
    lines.splice(1, 0, "| " + Array(colCount).fill("---").join(" | ") + " |");
  }
  return lines.join("\n");
}

function tableMarkdown(item: {
  type?: string;
  md?: string;
  rows?: TableItem["rows"];
}): string | null {
  if (item.type !== "table") return null;
  if (item.md?.trim()) return item.md.trim();
  if (item.rows?.length) return rowsToMarkdown(item.rows);
  return null;
}

function proseFromItems(
  items: Array<{ type?: string; md?: string; value?: string }>
): string {
  const parts: string[] = [];
  for (const item of items) {
    if (item.type === "table") continue;
    const text = item.md?.trim() || item.value?.trim();
    if (text) parts.push(text);
  }
  return parts.join("\n\n").trim();
}

function pageFromItems(
  pageNumber: number,
  items: Array<{ type?: string; md?: string; value?: string; rows?: TableItem["rows"] }>,
  fallbackMarkdown: string
): ParsedPage {
  const tables: string[] = [];
  for (const item of items) {
    const md = tableMarkdown(item);
    if (md) tables.push(md);
  }

  const prose = proseFromItems(items) || fallbackMarkdown.trim();
  return { pageNumber, prose, tables };
}

function isMarkdownSuccess(
  page: MarkdownPage
): page is { success: true; page_number: number; markdown: string } {
  return page.success === true;
}

function isStructuredSuccess(
  page: StructuredPage
): page is {
  success: true;
  page_number: number;
  items: Array<{ type?: string; md?: string; value?: string; rows?: TableItem["rows"] }>;
} {
  return page.success === true;
}

/**
 * Parse a PDF buffer with LlamaParse.
 * Returns per-page prose and separate markdown tables (never mixed in one chunk).
 */
export async function parsePdfPages(
  buffer: Buffer,
  fileName: string
): Promise<ParsedPage[]> {
  const { apiKey, tier, version } = getLlamaParseConfig();
  const client = new LlamaCloud({ apiKey });

  const bytes = new Uint8Array(buffer);
  const file = new File([bytes], fileName, { type: "application/pdf" });
  const uploaded = await client.files.create({ file, purpose: "parse" });

  const expand: Array<"markdown" | "items"> =
    tier === "fast" ? ["markdown"] : ["markdown", "items"];

  const result = await client.parsing.parse({
    file_id: uploaded.id,
    tier,
    version,
    expand,
    output_options: {
      markdown: {
        tables: { output_tables_as_markdown: true },
      },
    },
  });

  if (result.job.status !== "COMPLETED") {
    throw new Error(
      `LlamaParse job failed: ${result.job.status}${result.job.error_message ? ` — ${result.job.error_message}` : ""}`
    );
  }

  const markdownPages = (result.markdown?.pages ?? []) as MarkdownPage[];
  const itemPages = (result.items?.pages ?? []) as StructuredPage[];

  const pages: ParsedPage[] = [];

  if (itemPages.length > 0) {
    for (const page of itemPages) {
      if (!isStructuredSuccess(page)) continue;
      const pageNumber = page.page_number;
      const fallback =
        markdownPages.find(
          (p) => isMarkdownSuccess(p) && p.page_number === pageNumber
        );
      const fallbackMd = fallback && isMarkdownSuccess(fallback) ? fallback.markdown : "";
      pages.push(pageFromItems(pageNumber, page.items, fallbackMd));
    }
  } else {
    for (const page of markdownPages) {
      if (!isMarkdownSuccess(page)) continue;
      pages.push({
        pageNumber: page.page_number,
        prose: page.markdown.trim(),
        tables: [],
      });
    }
  }

  return pages
    .filter((p) => p.prose.length >= MIN_PROSE_LENGTH || p.tables.length > 0)
    .sort((a, b) => a.pageNumber - b.pageNumber);
}
