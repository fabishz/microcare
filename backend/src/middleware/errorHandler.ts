import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

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
  const { method, path, ip } = req;

  // Log the error using winston
  if (err instanceof ApiError) {
    const logData = {
      method,
      path,
      ip,
      code: err.code,
      details: err.details,
    };

    if (err.statusCode >= 500) {
      logger.error(`API Error: ${err.message}`, { ...logData, stack: err.stack });
    } else {
      logger.warn(`API Warning: ${err.message}`, logData);
    }

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
  } else {
    // Log unhandled errors as errors
    logger.error(`Unhandled Error: ${err.message}`, {
      method,
      path,
      ip,
      stack: err.stack,
    });

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
}

/**
 * 404 Not Found middleware
 * Should be placed after all route definitions
 * 
 * Requirement 4.4: WHEN a resource is not found, THE system SHALL return HTTP 404 Not Found
 */
export function notFoundHandler(_req: Request, res: Response): void {
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
