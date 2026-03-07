// Re-export domain errors for backward compatibility
export {
  DomainError as AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ProcessingError,
  ConflictError,
  RepositoryError,
  ExternalServiceError,
} from "@/lib/errors/domain-errors";

import { ZodError } from "zod";
import { DomainError } from "@/lib/errors/domain-errors";

/**
 * Handle errors and convert them to consistent HTTP response format
 */
export function handleError(error: unknown): { 
  message: string; 
  statusCode: number; 
  code?: string 
} {
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join("; ") || "Validation failed";
    return {
      message,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    };
  }

  if (error instanceof DomainError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    statusCode: 500,
    code: "UNKNOWN_ERROR",
  };
}

