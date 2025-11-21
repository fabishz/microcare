import { AuthResponse, UserProfile } from '../types/index.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateTokenPair } from '../utils/jwt.js';
import UserRepository from '../repositories/UserRepository.js';

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

    // Return response
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
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

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // Return response
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
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
