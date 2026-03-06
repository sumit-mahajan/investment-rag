import { z } from "zod";

export const DocumentUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 50 * 1024 * 1024, {
    message: "File size must be less than 50MB",
  }).refine((file) => file.type === "application/pdf", {
    message: "Only PDF files are allowed",
  }),
  metadata: z.object({
    companyName: z.string().optional(),
    tickerSymbol: z.string().optional(),
    cik: z.string().optional(),
    filingType: z.enum(["10-K", "10-Q", "8-K", "other"]).optional(),
    filingDate: z.string().optional(),
    fiscalYear: z.number().optional(),
    fiscalPeriod: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }).optional(),
});

export const AnalysisRequestSchema = z.object({
  documentId: z.string().uuid(),
  criteriaIds: z.array(z.string()).min(1).max(10),
});

export const QueryRequestSchema = z.object({
  documentId: z.string().uuid(),
  query: z.string().min(1).max(1000),
  topK: z.number().min(1).max(50).optional(),
});
