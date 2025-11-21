import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Error logger utility
 * Logs errors with appropriate severity levels
 */
function logError(err: Error | ApiError, req: Request): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || 'unknown';

  if (err instanceof ApiError) {
    // Log API errors based on status code
    if (err.statusCode >= 500) {
      console.error(
        `[${timestamp}] ERROR ${method} ${path} - ${err.statusCode} ${err.code}: ${err.message} (IP: ${ip})`
      );
    } else if (err.statusCode >= 400) {
      console.warn(
        `[${timestamp}] WARN ${method} ${path} - ${err.statusCode} ${err.code}: ${err.message} (IP: ${ip})`
      );
    }

    // Log details if present (for debugging)
    if (err.details && Object.keys(err.details).length > 0) {
      console.debug(`[${timestamp}] DEBUG Error details:`, err.details);
    }
  } else {
    // Log unhandled errors
    console.error(
      `[${timestamp}] ERROR ${method} ${path} - Unhandled error: ${err.message} (IP: ${ip})`
    );
    console.error(`[${timestamp}] ERROR Stack trace:`, err.stack);
  }
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * - Returns appropriate HTTP status codes for all error scenarios
 * - Provides validation error details for 400 errors
 * - Logs errors appropriately
 * - Returns generic messages for 500 errors (no internal details exposed)
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // Log the error
  logError(err, req);

  // Handle ApiError instances
  if (err instanceof ApiError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      timestamp,
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle generic errors - return generic message without exposing internal details
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
    timestamp,
  };

  res.status(500).json(errorResponse);
}

/**
 * 404 Not Found middleware
 * Should be placed after all route definitions
 * 
 * Requirement 4.4: WHEN a resource is not found, THE system SHALL return HTTP 404 Not Found
 */
export function notFoundHandler(req: Request, res: Response): void {
  const timestamp = new Date().toISOString();

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND_ERROR',
      message: 'Resource not found',
    },
    timestamp,
  };

  res.status(404).json(errorResponse);
}

// Re-export ApiError for backward compatibility
export { ApiError };
