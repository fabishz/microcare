/**
 * Custom Error Classes for API Error Handling
 * Provides specific error types for different error scenarios
 */

/**
 * Base API Error class
 * All custom errors should extend this class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Validation Error (400 Bad Request)
 * Thrown when input validation fails
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Thrown when authentication fails or credentials are invalid
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super(401, message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Thrown when user lacks permissions to access a resource
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super(403, message, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error (404 Not Found)
 * Thrown when a requested resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(404, message, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409 Conflict)
 * Thrown when a resource already exists or there's a conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(409, message, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 * Thrown when rate limiting is exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', details?: Record<string, unknown>) {
    super(429, message, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Internal Server Error (500 Internal Server Error)
 * Thrown for unexpected server-side errors
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Database Error (500 Internal Server Error)
 * Thrown when database operations fail
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(500, message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
