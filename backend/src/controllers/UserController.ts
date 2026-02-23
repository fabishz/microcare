import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../utils/errors.js';
import UserService from '../services/UserService.js';
import { logAuditEvent, AuditEventType } from '../utils/audit.js';

/**
 * UserController
 * Handles HTTP requests for user profile management endpoints
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * - Implements GET /api/v1/users/profile endpoint
 * - Implements PUT /api/v1/users/profile endpoint
 * - Implements POST /api/v1/users/change-password endpoint
 * - Adds authentication requirement to all endpoints
 * - Adds input validation for profile updates
 */

export class UserController {
  /**
   * Get user profile
   * GET /api/v1/users/profile
   * 
   * Requirement 2.1: WHEN an authenticated user requests their profile,
   * THE system SHALL return their user information with HTTP 200 status
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Get user profile from service
      const userProfile = await UserService.getUserProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: userProfile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('User not found')) {
          throw new NotFoundError(error.message);
        }

        if (error.message.includes('required')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to retrieve profile', 'PROFILE_RETRIEVAL_FAILED');
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   * 
   * Requirement 2.2: WHEN an authenticated user updates their profile (name, email, preferences),
   * THE system SHALL validate the input and persist changes to the database
   * 
   * Requirement 2.3: WHEN a user attempts to update another user's profile,
   * THE system SHALL reject the request with HTTP 403 Forbidden
   * 
   * Requirement 2.4: WHEN profile data is invalid (malformed email, empty name),
   * THE system SHALL return HTTP 400 Bad Request with validation error details
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { name, email } = req.body;

      // Validate that at least one field is provided
      if (name === undefined && email === undefined) {
        throw new ValidationError('At least one field (name or email) must be provided');
      }

      // Validate name if provided
      if (name !== undefined) {
        if (typeof name !== 'string') {
          throw new ValidationError('Name must be a string', { name: 'Name must be a string' });
        }

        if (name.trim().length === 0) {
          throw new ValidationError('Name cannot be empty', { name: 'Name cannot be empty' });
        }
      }

      // Validate email if provided
      if (email !== undefined) {
        if (typeof email !== 'string') {
          throw new ValidationError('Email must be a string', { email: 'Email must be a string' });
        }

        if (!email.includes('@') || !email.includes('.')) {
          throw new ValidationError('Invalid email format', { email: 'Invalid email format' });
        }
      }

      // Update profile through service (includes authorization check)
      const updatedProfile = await UserService.updateUserProfile(
        req.user.userId,
        req.user.userId,
        { name, email }
      );

      // Audit log profile update
      logAuditEvent(AuditEventType.SENSITIVE_DATA_ACCESS, {
        userId: req.user.userId,
        success: true,
        action: 'PROFILE_UPDATE',
        metadata: { updatedFields: Object.keys({ name, email }).filter(k => (req.body as any)[k] !== undefined) },
      });

      res.status(200).json({
        success: true,
        data: updatedProfile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          throw new AuthorizationError(error.message);
        }

        if (error.message.includes('User not found')) {
          throw new NotFoundError(error.message);
        }

        if (error.message.includes('Invalid') || error.message.includes('empty') || error.message.includes('already')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to update profile', 'PROFILE_UPDATE_FAILED');
    }
  }

  /**
   * Change user password
   * POST /api/v1/users/change-password
   * 
   * Requirement 2.5: WHEN a user changes their password,
   * THE system SHALL hash the new password and update the database securely
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Missing required fields', {
          currentPassword: !currentPassword ? 'Current password is required' : undefined,
          newPassword: !newPassword ? 'New password is required' : undefined,
        });
      }

      // Validate both are strings
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        throw new ValidationError('Passwords must be strings');
      }

      // Change password through service (includes authorization check)
      const updatedProfile = await UserService.changePassword(
        req.user.userId,
        req.user.userId,
        { currentPassword, newPassword }
      );

      // Audit log password change
      logAuditEvent(AuditEventType.PASSWORD_CHANGE_SUCCESS, {
        userId: req.user.userId,
        success: true,
      });

      res.status(200).json({
        success: true,
        data: updatedProfile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          throw new AuthorizationError(error.message);
        }

        if (error.message.includes('User not found')) {
          throw new NotFoundError(error.message);
        }

        if (error.message.includes('incorrect') || error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('different')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to change password', 'PASSWORD_CHANGE_FAILED');
    }
  }

  /**
   * Complete user onboarding
   * POST /api/v1/users/complete-onboarding
   */
  async completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Mark onboarding as complete
      const updatedProfile = await UserService.completeOnboarding(req.user.userId);

      res.status(200).json({
        success: true,
        data: updatedProfile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('Not authenticated')) {
          throw new AuthenticationError(error.message);
        }

        if (error.message.includes('User not found')) {
          throw new NotFoundError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to complete onboarding', 'ONBOARDING_COMPLETION_FAILED');
    }
  }
}

export default new UserController();
