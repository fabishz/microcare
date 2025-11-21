import { Router, Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

/**
 * Authentication Routes
 * 
 * Requirements: 1.1, 1.2, 4.1, 4.2
 * - POST /api/auth/register - User registration
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - User logout
 * - POST /api/auth/refresh - Refresh access token
 */

const router = Router();

/**
 * Wrapper function to handle async controller methods
 * Catches errors and passes them to the error handler middleware
 */
function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
}

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!",
 *   "name": "John Doe"
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc...",
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-01T00:00:00Z"
 *     }
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing or invalid fields
 * - 409 Conflict: Email already registered
 * - 500 Internal Server Error: Server error
 */
router.post('/register', asyncHandler(AuthController.register.bind(AuthController)));

/**
 * POST /api/auth/login
 * Login a user
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc...",
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-01T00:00:00Z"
 *     }
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing or invalid fields
 * - 401 Unauthorized: Invalid email or password
 * - 500 Internal Server Error: Server error
 */
router.post('/login', asyncHandler(AuthController.login.bind(AuthController)));

/**
 * POST /api/auth/logout
 * Logout a user (requires authentication)
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Logged out successfully"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 500 Internal Server Error: Server error
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(AuthController.logout.bind(AuthController))
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * Request body:
 * {
 *   "refreshToken": "eyJhbGc..."
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc..."
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing refresh token
 * - 401 Unauthorized: Invalid or expired refresh token
 * - 500 Internal Server Error: Server error
 */
router.post('/refresh', asyncHandler(AuthController.refresh.bind(AuthController)));

export default router;
