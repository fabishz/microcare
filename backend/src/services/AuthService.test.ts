import { AuthService } from './AuthService.js';
import UserRepository from '../repositories/UserRepository.js';
import * as passwordUtils from '../utils/password.js';
import * as jwtUtils from '../utils/jwt.js';

// Mock dependencies
jest.mock('../repositories/UserRepository.js');
jest.mock('../utils/password.js');
jest.mock('../utils/jwt.js');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validEmail = 'user@example.com';
    const validPassword = 'ValidPass123!';
    const validName = 'John Doe';

    beforeEach(() => {
      // Set up default mock for validatePassword to return valid
      (passwordUtils.validatePassword as jest.Mock).mockReturnValue({ valid: true });
    });

    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: validEmail,
        name: validName,
        passwordHash: 'hashed-password',
        role: 'USER',
        aiConsent: false,
        hasCompletedOnboarding: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await authService.register(validEmail, validPassword, validName);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: validEmail,
          name: validName,
          role: mockUser.role,
          aiConsent: mockUser.aiConsent,
          hasCompletedOnboarding: mockUser.hasCompletedOnboarding,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(validPassword);
      expect(UserRepository.create).toHaveBeenCalledWith(validEmail, validName, 'hashed-password');
      expect(jwtUtils.generateTokenPair).toHaveBeenCalledWith('user-123', validEmail);
    });

    it('should reject registration with missing email', async () => {
      await expect(authService.register('', validPassword, validName)).rejects.toThrow(
        'Email, password, and name are required'
      );
    });

    it('should reject registration with missing password', async () => {
      await expect(authService.register(validEmail, '', validName)).rejects.toThrow(
        'Email, password, and name are required'
      );
    });

    it('should reject registration with missing name', async () => {
      await expect(authService.register(validEmail, validPassword, '')).rejects.toThrow(
        'Email, password, and name are required'
      );
    });

    it('should reject registration with invalid email format', async () => {
      await expect(authService.register('invalid-email', validPassword, validName)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should reject registration with empty name', async () => {
      await expect(authService.register(validEmail, validPassword, '   ')).rejects.toThrow(
        'Name cannot be empty'
      );
    });

    it('should reject registration with invalid password', async () => {
      (passwordUtils.validatePassword as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Password must be at least 8 characters long',
      });

      await expect(authService.register(validEmail, 'weak', validName)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject registration if email already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: validEmail,
        name: 'Existing User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(validEmail, validPassword, validName)).rejects.toThrow(
        'Email already registered'
      );

      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle password hashing errors', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(validEmail, validPassword, validName)).rejects.toThrow(
        'Hashing failed'
      );
    });

    it('should handle user creation errors', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (UserRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.register(validEmail, validPassword, validName)).rejects.toThrow(
        'Database error'
      );
    });

    it('should accept various valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        const mockUser = {
          id: 'user-123',
          email,
          name: validName,
          passwordHash: 'hashed-password',
          role: 'USER',
          aiConsent: false,
          hasCompletedOnboarding: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
        (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
        (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
        (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });

        const result = await authService.register(email, validPassword, validName);
        expect(result.user.email).toBe(email);
      }
    });
  });

  describe('login', () => {
    const validEmail = 'user@example.com';
    const validPassword = 'ValidPass123!';

    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: validEmail,
        name: 'John Doe',
        passwordHash: 'hashed-password',
        role: 'USER',
        aiConsent: false,
        hasCompletedOnboarding: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await authService.login(validEmail, validPassword);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: validEmail,
          name: 'John Doe',
          role: mockUser.role,
          aiConsent: mockUser.aiConsent,
          hasCompletedOnboarding: mockUser.hasCompletedOnboarding,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(validPassword, 'hashed-password');
      expect(jwtUtils.generateTokenPair).toHaveBeenCalledWith('user-123', validEmail);
    });

    it('should reject login with missing email', async () => {
      await expect(authService.login('', validPassword)).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should reject login with missing password', async () => {
      await expect(authService.login(validEmail, '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should reject login with non-existent email', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(validEmail, validPassword)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(passwordUtils.comparePassword).not.toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: validEmail,
        name: 'John Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(validEmail, 'WrongPassword123!')).rejects.toThrow(
        'Invalid email or password'
      );

      expect(jwtUtils.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should handle password comparison errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: validEmail,
        name: 'John Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockRejectedValue(new Error('Comparison failed'));

      await expect(authService.login(validEmail, validPassword)).rejects.toThrow('Comparison failed');
    });

    it('should handle database errors during user lookup', async () => {
      (UserRepository.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.login(validEmail, validPassword)).rejects.toThrow('Database error');
    });

    it('should not expose whether email exists or password is wrong', async () => {
      // Both scenarios should return the same error message
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const error1 = await authService.login(validEmail, validPassword).catch((e) => e.message);

      const mockUser = {
        id: 'user-123',
        email: validEmail,
        name: 'John Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      const error2 = await authService.login(validEmail, validPassword).catch((e) => e.message);

      expect(error1).toBe(error2);
      expect(error1).toBe('Invalid email or password');
    });
  });

  describe('Integration: Register and Login', () => {
    it('should allow user to register and then login', async () => {
      const email = 'user@example.com';
      const password = 'ValidPass123!';
      const name = 'John Doe';

      const mockUser = {
        id: 'user-123',
        email,
        name,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Register
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
      });

      const registerResult = await authService.register(email, password, name);
      expect(registerResult.user.email).toBe(email);

      // Login
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
      });

      const loginResult = await authService.login(email, password);
      expect(loginResult.user.email).toBe(email);
      expect(loginResult.user.id).toBe('user-123');
    });
  });
});
