import { AuthResponse, UserProfile } from '../types/index.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateTokenPair } from '../utils/jwt.js';
import UserRepository from '../repositories/UserRepository.js';
import { logAuditEvent, AuditEventType } from '../utils/audit.js';

/**
 * AuthService
 * Handles authentication logic including registration, login, and token generation
 */

export class AuthService {
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
   * Register a new user
   * @param email - The user's email
   * @param password - The user's password
   * @param name - The user's name
   * @returns AuthResponse with tokens and user profile
   * @throws Error if registration fails
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    // Validate inputs
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate name
    if (name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await UserRepository.create(email, name, passwordHash);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // Audit log registration
    logAuditEvent(AuditEventType.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      success: true,
      metadata: { role: user.role },
    });

    // Return response
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }

  /**
   * Login a user
   * @param email - The user's email
   * @param password - The user's password
   * @returns AuthResponse with tokens and user profile
   * @throws Error if login fails
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check for account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);

      logAuditEvent(AuditEventType.USER_LOGIN_FAILURE, {
        email,
        success: false,
        metadata: { reason: 'Account locked', remainingTimeMins: remainingTime },
      });

      throw new Error(`Account is temporarily locked. Please try again in ${remainingTime} minutes.`);
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      // Increment failed attempts and lock account if necessary
      await UserRepository.incrementFailedLoginAttempts(user.id);

      const updatedUser = await UserRepository.findById(user.id);
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_DURATION_MINS = 15;

      if (updatedUser && updatedUser.failedLoginAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION_MINS * 60000);
        await UserRepository.lockAccount(user.id, lockoutTime);

        logAuditEvent(AuditEventType.ACCOUNT_LOCKED, {
          userId: user.id,
          email: user.email,
          success: true,
          metadata: { durationMins: LOCKOUT_DURATION_MINS },
        });

        throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINS} minutes.`);
      }

      logAuditEvent(AuditEventType.USER_LOGIN_FAILURE, {
        email,
        success: false,
        metadata: { reason: 'Invalid password', currentAttempts: updatedUser?.failedLoginAttempts },
      });

      throw new Error('Invalid email or password');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await UserRepository.resetFailedLoginAttempts(user.id);

      if (user.lockoutUntil) {
        logAuditEvent(AuditEventType.ACCOUNT_UNLOCKED, {
          userId: user.id,
          email: user.email,
          success: true,
        });
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // Audit log login
    logAuditEvent(AuditEventType.USER_LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      success: true,
    });

    // Return response
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }
}

export default new AuthService();
