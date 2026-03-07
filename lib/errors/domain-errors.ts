/**
 * Base domain error class
 * All domain-specific errors inherit from this
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * Unauthorized access error (403)
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized access to resource") {
    super(message, 403, "UNAUTHORIZED");
  }
}

/**
 * Validation error for business rules (400)
 */
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/**
 * Processing error for async operations (500)
 */
export class ProcessingError extends DomainError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 500, "PROCESSING_ERROR");
  }
}

/**
 * Conflict error for duplicate resources (409)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Database operation error (500)
 */
export class RepositoryError extends DomainError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 500, "REPOSITORY_ERROR");
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends DomainError {
  constructor(
    service: string,
    message: string,
    public readonly originalError?: Error
  ) {
    super(`${service} error: ${message}`, 502, "EXTERNAL_SERVICE_ERROR");
  }
}
