import jwt, { VerifyOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

/**
 * JWT Token Manager
 * Handles token generation, verification, and refresh token logic
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

/**
 * Generate an access token with configurable expiration
 * @param userId - The user's unique identifier
 * @param email - The user's email address
 * @param expiresIn - Token expiration time (default: 15m)
 * @returns The generated JWT token
 */
export function generateAccessToken(
  userId: string,
  email: string,
  expiresIn: string | number = JWT_EXPIRATION
): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    email,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  } as any);
}

/**
 * Generate a refresh token with configurable expiration
 * @param userId - The user's unique identifier
 * @param expiresIn - Token expiration time (default: 7d)
 * @returns The generated refresh token
 */
export function generateRefreshToken(
  userId: string,
  expiresIn: string | number = REFRESH_TOKEN_EXPIRATION
): string {
  const payload = {
    userId,
    type: 'refresh',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  } as any);
}

/**
 * Generate both access and refresh tokens
 * @param userId - The user's unique identifier
 * @param email - The user's email address
 * @returns Object containing both access and refresh tokens
 */
export function generateTokenPair(
  userId: string,
  email: string
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId),
  };
}

/**
 * Verify an access token and extract payload
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const options: VerifyOptions = {
      algorithms: ['HS256'],
    };
    const decoded = jwt.verify(token, JWT_SECRET, options);

    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify a refresh token and extract payload
 * @param token - The refresh token to verify
 * @returns The decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(
  token: string
): { userId: string; type: string; iat: number; exp: number } {
  try {
    const options: VerifyOptions = {
      algorithms: ['HS256'],
    };
    const decoded = jwt.verify(token, JWT_SECRET, options);

    const payload = decoded as { userId: string; type: string; iat: number; exp: number };

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode a token without verification (for debugging/inspection only)
 * @param token - The JWT token to decode
 * @returns The decoded token payload
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  return jwt.decode(token) as Record<string, unknown> | null;
}

/**
 * Check if a token is expired
 * @param token - The JWT token to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}
