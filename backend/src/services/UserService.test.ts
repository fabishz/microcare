import { UserService } from './UserService.js';
import UserRepository from '../repositories/UserRepository.js';
import * as passwordUtils from '../utils/password.js';

// Mock dependencies
jest.mock('../repositories/UserRepository.js');
jest.mock('../utils/password.js');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should successfully retrieve user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserProfile('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      expect(UserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should reject with missing user ID', async () => {
      await expect(userService.getUserProfile('')).rejects.toThrow('User ID is required');
    });

    it('should reject when user not found', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserProfile('non-existent')).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      (UserRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserProfile('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      passwordHash: 'hashed-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should successfully update user name', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Jane Doe',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, userId, { name: 'Jane Doe' });

      expect(result.name).toBe('Jane Doe');
      expect(UserRepository.update).toHaveBeenCalledWith(userId, { name: 'Jane Doe' });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should successfully update user email', async () => {
      const updatedUser = {
        ...mockUser,
        email: 'newemail@example.com',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, userId, {
        email: 'newemail@example.com',
      });

      expect(result.email).toBe('newemail@example.com');
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('newemail@example.com');
      expect(UserRepository.update).toHaveBeenCalledWith(userId, { email: 'newemail@example.com' });
    });

    it('should successfully update both name and email', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Jane Smith',
        email: 'jane@example.com',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, userId, {
        name: 'Jane Smith',
        email: 'jane@example.com',
      });

      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
      expect(UserRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });

    it('should reject unauthorized profile update', async () => {
      await expect(
        userService.updateUserProfile('user-123', 'user-456', { name: 'Hacker' })
      ).rejects.toThrow('Unauthorized: Cannot update another user\'s profile');

      expect(UserRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject with empty name', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.updateUserProfile(userId, userId, { name: '   ' })
      ).rejects.toThrow('Name cannot be empty');
    });

    it('should reject with invalid email format', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.updateUserProfile(userId, userId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject if new email already in use', async () => {
      const existingUser = {
        id: 'user-456',
        email: 'taken@example.com',
        name: 'Other User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        userService.updateUserProfile(userId, userId, { email: 'taken@example.com' })
      ).rejects.toThrow('Email already in use');

      expect(UserRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Jane Doe',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, userId, {
        name: 'Jane Doe',
        email: 'user@example.com',
      });

      expect(result.email).toBe('user@example.com');
      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should return current profile when no updates provided', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.updateUserProfile(userId, userId, {});

      expect(result.id).toBe(userId);
      expect(UserRepository.update).not.toHaveBeenCalled();
    });

    it('should handle user not found during update', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateUserProfile(userId, userId, { name: 'Jane' })
      ).rejects.toThrow('User not found');
    });

    it('should trim whitespace from name and email', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Jane Doe',
        email: 'jane@example.com',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      await userService.updateUserProfile(userId, userId, {
        name: '  Jane Doe  ',
        email: '  jane@example.com  ',
      });

      expect(UserRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });
  });

  describe('changePassword', () => {
    const userId = 'user-123';
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass456!';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      passwordHash: 'hashed-current-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    beforeEach(() => {
      (passwordUtils.validatePassword as jest.Mock).mockReturnValue({ valid: true });
    });

    it('should successfully change password', async () => {
      const updatedUser = {
        ...mockUser,
        passwordHash: 'hashed-new-password',
        updatedAt: new Date('2024-01-02'),
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock)
        .mockResolvedValueOnce(true) // current password matches
        .mockResolvedValueOnce(false); // new password is different
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-new-password');
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.changePassword(userId, userId, {
        currentPassword,
        newPassword,
      });

      expect(result.id).toBe(userId);
      expect(result).not.toHaveProperty('passwordHash');
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(currentPassword, mockUser.passwordHash);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(UserRepository.update).toHaveBeenCalledWith(userId, { passwordHash: 'hashed-new-password' });
    });

    it('should reject unauthorized password change', async () => {
      await expect(
        userService.changePassword('user-123', 'user-456', {
          currentPassword,
          newPassword,
        })
      ).rejects.toThrow('Unauthorized: Cannot change another user\'s password');

      expect(UserRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject with missing current password', async () => {
      await expect(
        userService.changePassword(userId, userId, {
          currentPassword: '',
          newPassword,
        })
      ).rejects.toThrow('Current password and new password are required');
    });

    it('should reject with missing new password', async () => {
      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword: '',
        })
      ).rejects.toThrow('Current password and new password are required');
    });

    it('should reject when user not found', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword,
        })
      ).rejects.toThrow('User not found');
    });

    it('should reject with incorrect current password', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword: 'WrongPassword123!',
          newPassword,
        })
      ).rejects.toThrow('Current password is incorrect');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
    });

    it('should reject with invalid new password', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (passwordUtils.validatePassword as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Password must be at least 8 characters long',
      });

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword: 'weak',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
    });

    it('should reject if new password is same as current', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock)
        .mockResolvedValueOnce(true) // current password matches
        .mockResolvedValueOnce(true); // new password is same as current

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword: currentPassword,
        })
      ).rejects.toThrow('New password must be different from current password');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
    });

    it('should handle password comparison errors', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockRejectedValue(new Error('Comparison failed'));

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword,
        })
      ).rejects.toThrow('Comparison failed');
    });

    it('should handle password hashing errors', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (passwordUtils.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword,
        })
      ).rejects.toThrow('Hashing failed');
    });

    it('should handle database update errors', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-new-password');
      (UserRepository.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        userService.changePassword(userId, userId, {
          currentPassword,
          newPassword,
        })
      ).rejects.toThrow('Database error');
    });
  });
});
