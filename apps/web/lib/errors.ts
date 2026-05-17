// Typed API error classes + response mapper.
// All Route Handlers catch these and delegate to toApiError().

import type { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Typed error classes
// ---------------------------------------------------------------------------

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED" as const;
  readonly status = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;
  readonly status = 403;
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR" as const;
  readonly status = 400;
  readonly details: unknown;
  constructor(details: unknown, message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class NotFoundError extends Error {
  readonly code = "NOT_FOUND" as const;
  readonly status = 404;
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly code = "CONFLICT" as const;
  readonly status = 409;
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class InternalError extends Error {
  readonly code = "INTERNAL_ERROR" as const;
  readonly status = 500;
  constructor(message = "Internal server error") {
    super(message);
    this.name = "InternalError";
  }
}

// Union type for all typed API errors
export type ApiError =
  | UnauthorizedError
  | ForbiddenError
  | ValidationError
  | NotFoundError
  | ConflictError
  | InternalError;

// ---------------------------------------------------------------------------
// Response mapper
// ---------------------------------------------------------------------------

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Maps a typed error (or unknown) to a JSON Response with correct HTTP status.
 * Usage: catch (err) { return toApiError(err); }
 */
export function toApiError(err: unknown): Response {
  if (err instanceof UnauthorizedError) {
    return errorResponse(err.status, err.code, err.message);
  }
  if (err instanceof ForbiddenError) {
    return errorResponse(err.status, err.code, err.message);
  }
  if (err instanceof ValidationError) {
    return errorResponse(err.status, err.code, err.message, err.details);
  }
  if (err instanceof NotFoundError) {
    return errorResponse(err.status, err.code, err.message);
  }
  if (err instanceof ConflictError) {
    return errorResponse(err.status, err.code, err.message);
  }
  if (err instanceof InternalError) {
    return errorResponse(err.status, err.code, err.message);
  }
  // Unknown errors — log and return generic 500
  console.error("[api] Unhandled error:", err);
  return errorResponse(500, "INTERNAL_ERROR", "Internal server error");
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return Response.json(body, { status });
}

/**
 * Convert a ZodError into a ValidationError with structured field errors.
 */
export function fromZodError(err: ZodError): ValidationError {
  return new ValidationError(err.flatten(), "Validation failed");
}
