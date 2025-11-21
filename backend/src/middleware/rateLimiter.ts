import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks on login and registration endpoints
 * 
 * Requirements: 4.5
 */

/**
 * General rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP address
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Stricter rate limiter for login endpoint
 * Limits: 3 requests per 15 minutes per IP address
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for registration endpoint
 * Limits: 3 requests per hour per IP address
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per windowMs
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later',
      },
      timestamp: new Date().toISOString(),
    });
  },
});
