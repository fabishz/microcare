import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ApiError } from '../middleware/errorHandler.js';
import UserController from './UserController.js';
import UserService from '../services/UserService.js';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock UserService
jest.mock('../services/UserService.js');

describe('UserController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      user: {
        userId: 'user-123',
        email: 'user@example.com',
      },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (UserService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      await UserController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(UserService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile,
        })
      );
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;

      await expect(
        UserController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.getUserProfile).not.toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      (UserService.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        UserController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle service errors', async () => {
      (UserService.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        UserController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      mockReq.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const updatedProfile = {
        id: 'user-123',
        email: 'jane@example.com',
        name: 'Jane Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (UserService.updateUserProfile as jest.Mock).mockResolvedValue(updatedProfile);

      await UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(UserService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        'user-123',
        { name: 'Jane Doe', email: 'jane@example.com' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedProfile,
        })
      );
    });

    it('should update only name', async () => {
      mockReq.body = { name: 'Jane Doe' };

      const updatedProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Jane Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (UserService.updateUserProfile as jest.Mock).mockResolvedValue(updatedProfile);

      await UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(UserService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        'user-123',
        { name: 'Jane Doe', email: undefined }
      );
    });

    it('should update only email', async () => {
      mockReq.body = { email: 'newemail@example.com' };

      const updatedProfile = {
        id: 'user-123',
        email: 'newemail@example.com',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (UserService.updateUserProfile as jest.Mock).mockResolvedValue(updatedProfile);

      await UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(UserService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        'user-123',
        { name: undefined, email: 'newemail@example.com' }
      );
    });

    it('should reject when no fields are provided', async () => {
      mockReq.body = {};

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should reject when name is not a string', async () => {
      mockReq.body = { name: 123 };

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should reject when name is empty', async () => {
      mockReq.body = { name: '   ' };

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should reject when email is not a string', async () => {
      mockReq.body = { email: 123 };

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should reject when email format is invalid', async () => {
      mockReq.body = { email: 'invalid-email' };

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { name: 'Jane Doe' };

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should handle unauthorized update attempt', async () => {
      mockReq.body = { name: 'Jane Doe' };

      (UserService.updateUserProfile as jest.Mock).mockRejectedValue(
        new Error('Unauthorized: Cannot update another user\'s profile')
      );

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle email already in use error', async () => {
      mockReq.body = { email: 'taken@example.com' };

      (UserService.updateUserProfile as jest.Mock).mockRejectedValue(
        new Error('Email already in use')
      );

      await expect(
        UserController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockReq.body = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      };

      const updatedProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (UserService.changePassword as jest.Mock).mockResolvedValue(updatedProfile);

      await UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(UserService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'user-123',
        { currentPassword: 'OldPass123!', newPassword: 'NewPass456!' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedProfile,
        })
      );
    });

    it('should reject when current password is missing', async () => {
      mockReq.body = { newPassword: 'NewPass456!' };

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should reject when new password is missing', async () => {
      mockReq.body = { currentPassword: 'OldPass123!' };

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should reject when passwords are not strings', async () => {
      mockReq.body = {
        currentPassword: 123,
        newPassword: 456,
      };

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      };

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should handle incorrect current password error', async () => {
      mockReq.body = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass456!',
      };

      (UserService.changePassword as jest.Mock).mockRejectedValue(
        new Error('Current password is incorrect')
      );

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle invalid new password error', async () => {
      mockReq.body = {
        currentPassword: 'OldPass123!',
        newPassword: 'weak',
      };

      (UserService.changePassword as jest.Mock).mockRejectedValue(
        new Error('Invalid password format')
      );

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle same password error', async () => {
      mockReq.body = {
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!',
      };

      (UserService.changePassword as jest.Mock).mockRejectedValue(
        new Error('New password must be different from current password')
      );

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle user not found error', async () => {
      mockReq.body = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      };

      (UserService.changePassword as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        UserController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });
});
