export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 400 - Bad request error
export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details?: Record<string, unknown>,
  ) {
    super(message, 400, "VALIDATION_FAILED", true, details);
  }
}

// 404 - Not found error
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND", true);
  }
}

/**
 * 409 Conflict — the request conflicts with existing state.
 *
 * Used when:
 * - A custom alias is already taken
 * - A unique constraint would be violated
 * - An operation can't proceed due to the current state of the resource
 */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT", true);
  }
}

/**
 * 410 Gone — the resource existed but has expired or been permanently removed.
 *
 * Used specifically for expired short URLs. This is semantically different from 404:
 * - 404 means "we have no record of this"
 * - 410 means "this existed but is no longer available"
 *
 * Clients and search engines treat these differently — 410 tells crawlers to
 * remove the URL from their index, while 404 might be rechecked later.
 */
export class GoneError extends AppError {
  constructor(message = "Resource has expired") {
    super(message, 410, "GONE", true);
  }
}

/**
 * 429 Too Many Requests — rate limit exceeded.
 *
 * The error handler will add rate-limit headers to the response
 * based on the details field.
 */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true);
  }
}
