/**
 * Token Sanitizer
 * Prevents sensitive tokens from being logged or exposed in console output
 * 
 * Security Requirement 4.3: Ensure tokens are never logged or exposed
 */

/**
 * Sanitize an object by removing or masking sensitive token fields
 * Used before logging to prevent token exposure
 */
export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Mask sensitive token fields
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret')
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a safe console logger that sanitizes sensitive data
 */
export const safeConsole = {
  log: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeForLogging);
    console.log(...sanitized);
  },
  error: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeForLogging);
    console.error(...sanitized);
  },
  warn: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeForLogging);
    console.warn(...sanitized);
  },
  info: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeForLogging);
    console.info(...sanitized);
  },
  debug: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeForLogging);
    console.debug(...sanitized);
  },
};

export default safeConsole;
