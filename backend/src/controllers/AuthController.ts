import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ApiError } from '../middleware/errorHandler.js';
import AuthService from '../services/AuthService.js';
import { verifyRefreshToken, generateTokenPair } from '../utils/jwt.js';

/**
 * AuthController
 * Handles HTTP requests for authentication endpoints
 * 
 * Requirements: 1.1, 1.2, 4.1, 4.2
 * - Implements POST /api/auth/register endpoint
 * - Implements POST /api/auth/login endpoint
 * - Implements POST /api/auth/logout endpoint
 * - Implements POST /api/auth/refresh endpoint
 * - Adds input validation for all endpoints
 */

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   * 
   * Requirement 1.1: WHEN a user submits valid registration credentials (email, password, name),
   * THE system SHALL create a new user account and return a success response with HTTP 201 status
   */
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        throw new ApiError(400, 'Missing required fields', {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          name: !name ? 'Name is required' : undefined,
        });
      }

      // Validate email format
      if (typeof email !== 'string' || !email.includes('@')) {
        throw new ApiError(400, 'Invalid email format');
      }

      // Validate password is a string
      if (typeof password !== 'string') {
        throw new ApiError(400, 'Password must be a string');
      }

      // Validate name is a string
      if (typeof name !== 'string') {
        throw new ApiError(400, 'Name must be a string');
      }

      // Call AuthService to register user
      const authResponse = await AuthService.register(email, password, name);

      res.status(201).json({
        success: true,
        data: authResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        // Map service errors to appropriate HTTP status codes
        if (error.message.includes('already registered')) {
          throw new ApiError(409, error.message);
        }

        if (error.message.includes('Invalid') || error.message.includes('required')) {
          throw new ApiError(400, error.message);
        }
      }

      throw new ApiError(500, 'Registration failed');
    }
  }

  /**
   * Login a user
   * POST /api/auth/login
   * 
   * Requirement 1.2: WHEN a user submits valid login credentials, THE system SHALL authenticate
   * the user and return a JWT token with HTTP 200 status
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ApiError(400, 'Missing required fields', {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
        });
      }

      // Validate email format
      if (typeof email !== 'string' || !email.includes('@')) {
        throw new ApiError(400, 'Invalid email format');
      }

      // Validate password is a string
      if (typeof password !== 'string') {
        throw new ApiError(400, 'Password must be a string');
      }

      // Call AuthService to login user
      const authResponse = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        data: authResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        // Map service errors to appropriate HTTP status codes
        if (error.message.includes('Invalid email or password')) {
          throw new ApiError(401, 'Invalid email or password');
        }

        if (error.message.includes('required')) {
          throw new ApiError(400, error.message);
        }
      }

      throw new ApiError(500, 'Login failed');
    }
  }

  /**
   * Logout a user
   * POST /api/auth/logout
   * 
   * Requirement 1.5: WHEN a user logs out, THE system SHALL invalidate the session
   * and require re-authentication for subsequent requests
   * 
   * Note: Since we're using stateless JWT tokens, logout is handled client-side
   * by removing the token. This endpoint serves as a confirmation endpoint.
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      // Return success response
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Logout failed');
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   * 
   * Requirement 1.2: Generate JWT tokens on successful authentication
   * Uses refresh token to generate a new access token
   */
  async refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Validate refresh token is provided
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      // Validate refresh token is a string
      if (typeof refreshToken !== 'string') {
        throw new ApiError(400, 'Refresh token must be a string');
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Generate new token pair
      const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
        payload.userId,
        payload.userId // Note: We don't have email in refresh token, using userId as placeholder
      );

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        // Map JWT verification errors
        if (error.message.includes('expired') || error.message.includes('Invalid')) {
          throw new ApiError(401, error.message);
        }

        if (error.message.includes('required')) {
          throw new ApiError(400, error.message);
        }
      }

      throw new ApiError(500, 'Token refresh failed');
    }
  }
}

export default new AuthController();
