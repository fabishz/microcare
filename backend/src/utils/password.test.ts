import { validatePassword, hashPassword, comparePassword, isValidHash } from './password.js';

describe('Password Utilities', () => {
  describe('validatePassword', () => {
    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('special character');
    });

    it('should accept valid password', () => {
      const result = validatePassword('ValidPass123!');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', "'", '\\', '|', ',', '.', '<', '>', '/', '?'];

      specialChars.forEach((char) => {
        const password = `ValidPass123${char}`;
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept long passwords', () => {
      const result = validatePassword('VeryLongPassword123!WithManyCharacters');
      expect(result.valid).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'ValidPass123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should reject invalid password during hashing', async () => {
      const invalidPassword = 'weak';
      await expect(hashPassword(invalidPassword)).rejects.toThrow();
    });

    it('should use bcrypt format', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should support custom salt rounds', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password, 12);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('comparePassword', () => {
    let hashedPassword: string;

    beforeAll(async () => {
      hashedPassword = await hashPassword('ValidPass123!');
    });

    it('should return true for matching password', async () => {
      const result = await comparePassword('ValidPass123!', hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const result = await comparePassword('WrongPass123!', hashedPassword);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const result = await comparePassword('', hashedPassword);
      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const result = await comparePassword('validpass123!', hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle multiple comparisons correctly', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);

      const result1 = await comparePassword(password, hash);
      const result2 = await comparePassword(password, hash);
      const result3 = await comparePassword('WrongPass123!', hash);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });
  });

  describe('isValidHash', () => {
    it('should return true for valid bcrypt hash', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      expect(isValidHash(hash)).toBe(true);
    });

    it('should return false for invalid hash format', () => {
      expect(isValidHash('not-a-hash')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidHash('')).toBe(false);
    });

    it('should return false for random string', () => {
      expect(isValidHash('$2a$10$invalidhashformat')).toBe(false);
    });

    it('should validate bcrypt hash variants', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      // Hash should start with $2a$, $2b$, $2x$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(isValidHash(hash)).toBe(true);
    });
  });

  describe('Integration: Hash and Compare', () => {
    it('should hash and compare password successfully', async () => {
      const password = 'MySecurePass123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should handle multiple users with different passwords', async () => {
      const password1 = 'UserOne123!Pass';
      const password2 = 'UserTwo456!Pass';

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      const match1 = await comparePassword(password1, hash1);
      const match2 = await comparePassword(password2, hash2);
      const crossMatch = await comparePassword(password1, hash2);

      expect(match1).toBe(true);
      expect(match2).toBe(true);
      expect(crossMatch).toBe(false);
    });
  });
});
