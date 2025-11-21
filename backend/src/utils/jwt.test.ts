import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
} from './jwt.js';

describe('JWT Token Manager', () => {
  const testUserId = 'test-user-123';
  const testEmail = 'test@example.com';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate token with correct payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });

    it('should support custom expiration', () => {
      const token = generateAccessToken(testUserId, testEmail, '1h');
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate token with correct payload', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const { accessToken, refreshToken } = generateTokenPair(testUserId, testEmail);
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should generate tokens with correct payloads', () => {
      const { accessToken, refreshToken } = generateTokenPair(testUserId, testEmail);
      const accessDecoded = decodeToken(accessToken);
      const refreshDecoded = decodeToken(refreshToken);

      expect(accessDecoded?.userId).toBe(testUserId);
      expect(accessDecoded?.email).toBe(testEmail);
      expect(refreshDecoded?.userId).toBe(testUserId);
      expect(refreshDecoded?.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for tampered token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => {
        verifyAccessToken(tampered);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe(testUserId);
      expect(payload.type).toBe('refresh');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error if token type is not refresh', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);
      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow('Invalid token type');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid.token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid.token')).toBe(true);
    });

    it('should return true for token with missing exp claim', () => {
      // Create a token-like string without exp claim
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(isTokenExpired(invalidToken)).toBe(true);
    });
  });
});
