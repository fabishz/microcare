import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // Handle ApiError instances
  if (err instanceof ApiError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      timestamp,
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle generic errors
  console.error('Unhandled error:', err);

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
    },
    timestamp,
  };

  res.status(500).json(errorResponse);
}

/**
 * 404 Not Found middleware
 * Should be placed after all route definitions
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: 'Resource not found',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}
