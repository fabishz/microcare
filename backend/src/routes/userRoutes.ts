import { Router, Request, Response, NextFunction } from 'express';
import UserController from '../controllers/UserController.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

/**
 * User Profile Routes
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * - GET /api/users/profile - Get user profile
 * - PUT /api/users/profile - Update user profile
 * - POST /api/users/change-password - Change password
 * 
 * All endpoints require authentication
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
 * GET /api/users/profile
 * Get authenticated user's profile
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
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Server error
 */
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(UserController.getProfile.bind(UserController))
);

/**
 * PUT /api/users/profile
 * Update authenticated user's profile
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * Request body (at least one field required):
 * {
 *   "name": "Jane Doe",
 *   "email": "newemail@example.com"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "email": "newemail@example.com",
 *     "name": "Jane Doe",
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data or missing fields
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 403 Forbidden: Attempting to update another user's profile
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Server error
 */
router.put(
  '/profile',
  authMiddleware,
  asyncHandler(UserController.updateProfile.bind(UserController))
);

/**
 * POST /api/users/change-password
 * Change authenticated user's password
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * Request body:
 * {
 *   "currentPassword": "OldPassword123!",
 *   "newPassword": "NewPassword456!"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data, missing fields, or incorrect current password
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 403 Forbidden: Attempting to change another user's password
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Server error
 */
router.post(
  '/change-password',
  authMiddleware,
  asyncHandler(UserController.changePassword.bind(UserController))
);

export default router;
