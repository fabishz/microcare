import { Router, Request, Response, NextFunction } from 'express';
import UserController from '../controllers/UserController.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { validateRequest, sanitizeRequestBody } from '../middleware/validationMiddleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validators.js';

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
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Internal server error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information (name and/or email)
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 * 
 *                 format: email
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Internal server error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the authenticated user's password
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPassword456!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error - invalid input or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Internal server error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

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
  sanitizeRequestBody,
  validateRequest(updateProfileSchema),
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
  sanitizeRequestBody,
  validateRequest(changePasswordSchema),
  asyncHandler(UserController.changePassword.bind(UserController))
);

/**
 * @swagger
 * /api/users/complete-onboarding:
 *   post:
 *     summary: Complete user onboarding
 *     description: Mark the authenticated user's onboarding as complete
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
router.post(
  '/complete-onboarding',
  authMiddleware,
  asyncHandler(UserController.completeOnboarding.bind(UserController))
);

export default router;
