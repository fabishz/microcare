import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../utils/errors.js';
import EntryService from '../services/EntryService.js';

/**
 * EntryController
 * Handles HTTP requests for journal entry management endpoints
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * - Implements POST /api/v1/entries endpoint
 * - Implements GET /api/v1/entries endpoint with pagination
 * - Implements GET /api/v1/entries/:id endpoint
 * - Implements PUT /api/v1/entries/:id endpoint
 * - Implements DELETE /api/v1/entries/:id endpoint
 * - Adds authentication requirement to all endpoints
 * - Adds input validation for all endpoints
 */

export class EntryController {
  /**
   * Create a new journal entry
   * POST /api/v1/entries
   * 
   * Requirement 3.1: WHEN an authenticated user creates a journal entry with title and content,
   * THE system SHALL store the entry with a timestamp and return HTTP 201 Created
   */
  async createEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { title, content, mood, tags } = req.body;

      // Validate required fields
      if (!title || !content) {
        throw new ValidationError('Missing required fields', {
          title: !title ? 'Title is required' : undefined,
          content: !content ? 'Content is required' : undefined,
        });
      }

      // Validate title is a string
      if (typeof title !== 'string') {
        throw new ValidationError('Title must be a string', { title: 'Title must be a string' });
      }

      // Validate content is a string
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string', { content: 'Content must be a string' });
      }

      // Validate mood if provided
      if (mood !== undefined) {
        if (typeof mood !== 'string') {
          throw new ValidationError('Mood must be a string', { mood: 'Mood must be a string' });
        }
      }

      // Validate tags if provided
      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
          throw new ValidationError('Tags must be an array', { tags: 'Tags must be an array' });
        }

        if (!tags.every((tag) => typeof tag === 'string')) {
          throw new ValidationError('All tags must be strings', { tags: 'All tags must be strings' });
        }
      }

      // Create entry through service
      const entry = await EntryService.createEntry(req.user.userId, {
        title,
        content,
        mood,
        tags,
      });

      res.status(201).json({
        success: true,
        data: entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to create entry', 'ENTRY_CREATION_FAILED');
    }
  }

  /**
   * Get all journal entries for authenticated user with pagination
   * GET /api/v1/entries
   * 
   * Requirement 3.2: WHEN an authenticated user requests their journal entries,
   * THE system SHALL return a paginated list filtered by user with HTTP 200 status
   */
  async getUserEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Get pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sortBy = (req.query.sortBy as 'createdAt' | 'updatedAt') || 'createdAt';
      const order = (req.query.order as 'asc' | 'desc') || 'desc';

      // Validate pagination parameters
      if (page < 1) {
        throw new ValidationError('Page must be greater than 0', { page: 'Page must be greater than 0' });
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100', { limit: 'Limit must be between 1 and 100' });
      }

      // Validate sortBy parameter
      if (sortBy !== 'createdAt' && sortBy !== 'updatedAt') {
        throw new ValidationError('Invalid sortBy parameter', { sortBy: 'Must be createdAt or updatedAt' });
      }

      // Validate order parameter
      if (order !== 'asc' && order !== 'desc') {
        throw new ValidationError('Invalid order parameter', { order: 'Must be asc or desc' });
      }

      // Get entries through service
      const result = await EntryService.getUserEntries(
        req.user.userId,
        page,
        limit,
        sortBy,
        order
      );

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('greater')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to retrieve entries', 'ENTRIES_RETRIEVAL_FAILED');
    }
  }

  /**
   * Get a specific journal entry by ID
   * GET /api/v1/entries/:id
   * 
   * Requirement 3.3: WHEN an authenticated user requests a specific journal entry by ID,
   * THE system SHALL return the entry if ownership is verified, otherwise return HTTP 403 Forbidden
   * 
   * Requirement 3.6: WHEN a user attempts to access another user's journal entry,
   * THE system SHALL return HTTP 403 Forbidden
   */
  async getEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { id } = req.params;

      // Validate entry ID is provided
      if (!id) {
        throw new ValidationError('Entry ID is required');
      }

      // Get entry through service (includes ownership check)
      const entry = await EntryService.getEntry(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('access denied')) {
          throw new AuthorizationError('Access denied');
        }

        if (error.message.includes('not found')) {
          throw new NotFoundError('Entry not found');
        }

        if (error.message.includes('required')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to retrieve entry', 'ENTRY_RETRIEVAL_FAILED');
    }
  }

  /**
   * Update a journal entry
   * PUT /api/v1/entries/:id
   * 
   * Requirement 3.4: WHEN an authenticated user updates a journal entry they own,
   * THE system SHALL persist the changes and return HTTP 200 OK
   * 
   * Requirement 3.6: WHEN a user attempts to access another user's journal entry,
   * THE system SHALL return HTTP 403 Forbidden
   */
  async updateEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { id } = req.params;
      const { title, content, mood, tags } = req.body;

      // Validate entry ID is provided
      if (!id) {
        throw new ValidationError('Entry ID is required');
      }

      // Validate that at least one field is provided
      if (title === undefined && content === undefined && mood === undefined && tags === undefined) {
        throw new ValidationError('At least one field must be provided for update');
      }

      // Validate title if provided
      if (title !== undefined) {
        if (typeof title !== 'string') {
          throw new ValidationError('Title must be a string', { title: 'Title must be a string' });
        }
      }

      // Validate content if provided
      if (content !== undefined) {
        if (typeof content !== 'string') {
          throw new ValidationError('Content must be a string', { content: 'Content must be a string' });
        }
      }

      // Validate mood if provided
      if (mood !== undefined) {
        if (typeof mood !== 'string') {
          throw new ValidationError('Mood must be a string', { mood: 'Mood must be a string' });
        }
      }

      // Validate tags if provided
      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
          throw new ValidationError('Tags must be an array', { tags: 'Tags must be an array' });
        }

        if (!tags.every((tag) => typeof tag === 'string')) {
          throw new ValidationError('All tags must be strings', { tags: 'All tags must be strings' });
        }
      }

      // Update entry through service (includes ownership check)
      const updatedEntry = await EntryService.updateEntry(id, req.user.userId, {
        title,
        content,
        mood,
        tags,
      });

      res.status(200).json({
        success: true,
        data: updatedEntry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('access denied')) {
          throw new AuthorizationError('Access denied');
        }

        if (error.message.includes('not found')) {
          throw new NotFoundError('Entry not found');
        }

        if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to update entry', 'ENTRY_UPDATE_FAILED');
    }
  }

  /**
   * Delete a journal entry
   * DELETE /api/v1/entries/:id
   * 
   * Requirement 3.5: WHEN an authenticated user deletes a journal entry they own,
   * THE system SHALL remove the entry from the database and return HTTP 204 No Content
   * 
   * Requirement 3.6: WHEN a user attempts to access another user's journal entry,
   * THE system SHALL return HTTP 403 Forbidden
   */
  async deleteEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { id } = req.params;

      // Validate entry ID is provided
      if (!id) {
        throw new ValidationError('Entry ID is required');
      }

      // Delete entry through service (includes ownership check)
      await EntryService.deleteEntry(id, req.user.userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('access denied')) {
          throw new AuthorizationError('Access denied');
        }

        if (error.message.includes('not found')) {
          throw new NotFoundError('Entry not found');
        }

        if (error.message.includes('required')) {
          throw new ValidationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to delete entry', 'ENTRY_DELETION_FAILED');
    }
  }
}

export default new EntryController();
