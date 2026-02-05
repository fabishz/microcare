import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from './errorHandler.js';

/**
 * Extended Request interface with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user info to request
 * 
 * Requirements: 1.3, 1.4
 * - Implements JWT verification middleware
 * - Extracts user information from token and attaches to request
 * - Handles expired and invalid tokens with 401 response
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, 'Missing authorization header');
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'Invalid authorization header format');
    }

    const token = parts[1];

    // Verify token and extract payload
    const payload = verifyAccessToken(token);

    // Attach user information to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof Error) {
      const message = error.message;

      // Map JWT errors to 401 Unauthorized
      if (message.includes('expired') || message.includes('Invalid') || message.includes('Malformed')) {
        next(new ApiError(401, message));
        return;
      }
    }

    // Generic authentication error
    next(new ApiError(401, 'Authentication failed'));
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if token is missing or invalid
 * Useful for endpoints that work with or without authentication
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without authentication
      next();
      return;
    }

    const token = parts[1];

    // Try to verify token
    const payload = verifyAccessToken(token);

    // Attach user information if token is valid
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch {
    // Token verification failed, continue without authentication
    next();
  }
}
