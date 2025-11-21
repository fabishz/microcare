import bcrypt from 'bcrypt';

/**
 * Password Hashing and Validation Utilities
 * Handles secure password hashing, comparison, and validation
 */

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate password against security requirements
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - The password to validate
 * @returns Object with validation result and error message if invalid
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character (!@#$%^&*...)',
    };
  }

  return { valid: true };
}

/**
 * Hash a password using bcrypt with configurable salt rounds
 * @param password - The plaintext password to hash
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns The hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string, saltRounds: number = SALT_ROUNDS): Promise<string> {
  try {
    const validation = validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Compare a plaintext password with a hashed password
 * @param password - The plaintext password to compare
 * @param hash - The hashed password to compare against
 * @returns True if passwords match, false otherwise
 * @throws Error if comparison fails
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a password hash is valid (basic format check)
 * @param hash - The hash to validate
 * @returns True if hash appears to be a valid bcrypt hash
 */
export function isValidHash(hash: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ followed by cost and salt
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}
