import { Router, Request, Response, NextFunction } from 'express';
import EntryController from '../controllers/EntryController.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

/**
 * Journal Entry Routes
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * - POST /api/entries - Create new entry
 * - GET /api/entries - List user's entries (paginated)
 * - GET /api/entries/:id - Get specific entry
 * - PUT /api/entries/:id - Update entry
 * - DELETE /api/entries/:id - Delete entry
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
 * POST /api/entries
 * Create a new journal entry
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * Request body:
 * {
 *   "title": "My Day",
 *   "content": "Today was a good day...",
 *   "mood": "happy",
 *   "tags": ["work", "personal"]
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "title": "My Day",
 *     "content": "Today was a good day...",
 *     "mood": "happy",
 *     "tags": ["work", "personal"],
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing or invalid fields
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 500 Internal Server Error: Server error
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(EntryController.createEntry.bind(EntryController))
);

/**
 * GET /api/entries
 * Get all journal entries for authenticated user with pagination
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * Query parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 10, max: 100) - Number of entries per page
 * - sortBy: string (default: createdAt) - Field to sort by (createdAt or updatedAt)
 * - order: string (default: desc) - Sort order (asc or desc)
 * 
 * Example: GET /api/entries?page=1&limit=10&sortBy=createdAt&order=desc
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "data": [
 *       {
 *         "id": "uuid",
 *         "userId": "uuid",
 *         "title": "My Day",
 *         "content": "Today was a good day...",
 *         "mood": "happy",
 *         "tags": ["work", "personal"],
 *         "createdAt": "2024-01-01T00:00:00Z",
 *         "updatedAt": "2024-01-01T00:00:00Z"
 *       }
 *     ],
 *     "total": 42,
 *     "page": 1,
 *     "limit": 10,
 *     "totalPages": 5
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid pagination parameters
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 500 Internal Server Error: Server error
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(EntryController.getUserEntries.bind(EntryController))
);

/**
 * GET /api/entries/:id
 * Get a specific journal entry by ID
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * URL parameters:
 * - id: string - The entry ID
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "title": "My Day",
 *     "content": "Today was a good day...",
 *     "mood": "happy",
 *     "tags": ["work", "personal"],
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing entry ID
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 403 Forbidden: Entry belongs to another user
 * - 404 Not Found: Entry not found
 * - 500 Internal Server Error: Server error
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(EntryController.getEntry.bind(EntryController))
);

/**
 * PUT /api/entries/:id
 * Update a journal entry
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * URL parameters:
 * - id: string - The entry ID
 * 
 * Request body (at least one field required):
 * {
 *   "title": "Updated Title",
 *   "content": "Updated content...",
 *   "mood": "calm",
 *   "tags": ["updated", "tags"]
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "title": "Updated Title",
 *     "content": "Updated content...",
 *     "mood": "calm",
 *     "tags": ["updated", "tags"],
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:01:00Z"
 *   },
 *   "timestamp": "2024-01-01T00:01:00Z"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data or missing fields
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 403 Forbidden: Entry belongs to another user
 * - 404 Not Found: Entry not found
 * - 500 Internal Server Error: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(EntryController.updateEntry.bind(EntryController))
);

/**
 * DELETE /api/entries/:id
 * Delete a journal entry
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <accessToken>"
 * }
 * 
 * URL parameters:
 * - id: string - The entry ID
 * 
 * Response (204 No Content):
 * (empty body)
 * 
 * Error responses:
 * - 400 Bad Request: Missing entry ID
 * - 401 Unauthorized: Not authenticated or invalid token
 * - 403 Forbidden: Entry belongs to another user
 * - 404 Not Found: Entry not found
 * - 500 Internal Server Error: Server error
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(EntryController.deleteEntry.bind(EntryController))
);

export default router;
