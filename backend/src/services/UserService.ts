import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../types/index.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import UserRepository from '../repositories/UserRepository.js';

/**
 * UserService
 * Handles user profile management operations including profile retrieval, updates, and password changes
 */

export class UserService {
  /**
   * Validate email format
   * @param email - The email to validate
   * @returns True if email is valid, false otherwise
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user profile by ID
   * @param userId - The user's ID
   * @returns UserProfile without sensitive data
   * @throws Error if user not found
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      aiConsent: user.aiConsent,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return userProfile;
  }

  /**
   * Update user profile with authorization check
   * @param userId - The user's ID (for authorization)
   * @param targetUserId - The ID of the user to update
   * @param updateData - The profile data to update
   * @returns Updated UserProfile
   * @throws Error if authorization fails or validation fails
   */
  async updateUserProfile(
    userId: string,
    targetUserId: string,
    updateData: UpdateProfileRequest
  ): Promise<UserProfile> {
    // Authorization check: user can only update their own profile
    if (userId !== targetUserId) {
      throw new Error('Unauthorized: Cannot update another user\'s profile');
    }

    // Validate that user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate input data
    const updatePayload: { name?: string; email?: string; aiConsent?: boolean } = {};

    if (updateData.name !== undefined) {
      const trimmedName = updateData.name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Name cannot be empty');
      }
      updatePayload.name = trimmedName;
    }

    if (updateData.email !== undefined) {
      const trimmedEmail = updateData.email.trim();
      if (!this.validateEmail(trimmedEmail)) {
        throw new Error('Invalid email format');
      }

      // Check if email is already in use by another user
      if (trimmedEmail !== user.email) {
        const existingUser = await UserRepository.findByEmail(trimmedEmail);
        if (existingUser) {
          throw new Error('Email already in use');
        }
      }

      updatePayload.email = trimmedEmail;
    }

    if (updateData.aiConsent !== undefined) {
      updatePayload.aiConsent = !!updateData.aiConsent;
    }

    // If no valid updates, return current profile
    if (Object.keys(updatePayload).length === 0) {
      return this.getUserProfile(userId);
    }

    // Update user in database
    const updatedUser = await UserRepository.update(userId, updatePayload);

    const userProfile: UserProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      aiConsent: updatedUser.aiConsent,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return userProfile;
  }

  /**
   * Change user password with authorization check
   * @param userId - The user's ID (for authorization)
   * @param targetUserId - The ID of the user changing password
   * @param changePasswordData - Current and new password
   * @returns Updated UserProfile
   * @throws Error if authorization fails, current password is incorrect, or validation fails
   */
  async changePassword(
    userId: string,
    targetUserId: string,
    changePasswordData: ChangePasswordRequest
  ): Promise<UserProfile> {
    // Authorization check: user can only change their own password
    if (userId !== targetUserId) {
      throw new Error('Unauthorized: Cannot change another user\'s password');
    }

    // Validate inputs
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword) {
      throw new Error('Current password and new password are required');
    }

    // Get user from database
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const passwordMatch = await comparePassword(changePasswordData.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = validatePassword(changePasswordData.newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Prevent using the same password
    const samePassword = await comparePassword(changePasswordData.newPassword, user.passwordHash);
    if (samePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(changePasswordData.newPassword);

    // Update user password
    const updatedUser = await UserRepository.update(userId, { passwordHash: newPasswordHash });

    const userProfile: UserProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      aiConsent: updatedUser.aiConsent,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return userProfile;
  }

  /**
   * Mark onboarding as completed for a user
   * @param userId - The user's ID
   * @returns Updated UserProfile
   * @throws Error if user not found
   */
  async completeOnboarding(userId: string): Promise<UserProfile> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update onboarding status
    const updatedUser = await UserRepository.update(userId, { hasCompletedOnboarding: true });

    const userProfile: UserProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      aiConsent: updatedUser.aiConsent,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return userProfile;
  }

  /**
   * Delete a user account after password verification
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Password is incorrect');
    }

    await UserRepository.delete(userId);
  }
}

export default new UserService();
