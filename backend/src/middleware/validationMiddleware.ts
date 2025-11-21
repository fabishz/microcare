import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';
import {
  validateSchema,
  ValidationSchema,
} from '../utils/validators.js';

/**
 * Validation Middleware
 * Validates request body against a provided schema
 * 
 * Requirements: 4.1, 4.2
 * - Validates all request bodies against defined schemas
 * - Returns 400 Bad Request with validation error details
 * - Prevents invalid data from reaching controllers
 */

/**
 * Create a validation middleware for a specific schema
 * 
 * @param schema - The validation schema to validate against
 * @returns Express middleware function
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      const result = validateSchema(req.body, schema);

      if (!result.valid && result.errors) {
        // Throw validation error with details
        throw new ValidationError('Validation failed', result.errors);
      }

      // Validation passed, continue to next middleware
      next();
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  };
}

/**
 * Sanitize string inputs to prevent injection attacks
 * 
 * Requirements: 4.1, 4.2
 * - Removes leading/trailing whitespace
 * - Escapes HTML special characters
 * - Prevents XSS attacks
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Escape HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitize object inputs recursively
 * 
 * Requirements: 4.1, 4.2
 * - Sanitizes all string values in an object
 * - Handles nested objects and arrays
 * - Prevents injection attacks
 * 
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }

    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body
 * 
 * Requirements: 4.1, 4.2
 * - Sanitizes all string inputs in request body
 * - Prevents XSS and injection attacks
 * - Should be applied after body parsing middleware
 */
export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Sanitize request body
    req.body = sanitizeObject(req.body) as Record<string, unknown>;

    // Continue to next middleware
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}

/**
 * Middleware to sanitize query parameters
 * 
 * Requirements: 4.1, 4.2
 * - Sanitizes all string values in query parameters
 * - Prevents injection attacks
 */
export function sanitizeQueryParams(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Sanitize query parameters
    const sanitized = sanitizeObject(req.query);
    if (typeof sanitized === 'object' && sanitized !== null) {
      req.query = sanitized as Record<string, any>;
    }

    // Continue to next middleware
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}

/**
 * Middleware to sanitize URL parameters
 * 
 * Requirements: 4.1, 4.2
 * - Sanitizes all string values in URL parameters
 * - Prevents injection attacks
 */
export function sanitizeUrlParams(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Sanitize URL parameters
    const sanitized = sanitizeObject(req.params);
    if (typeof sanitized === 'object' && sanitized !== null) {
      req.params = sanitized as Record<string, string>;
    }

    // Continue to next middleware
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}
