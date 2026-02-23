import {
  JournalEntry,
  CreateEntryRequest,
  UpdateEntryRequest,
  PaginatedResponse,
} from '../types/index.js';
import EntryRepository from '../repositories/EntryRepository.js';
import { enqueueEntryAnalysis } from '../queues/analysisQueue.js';
import logger from '../utils/logger.js';

/**
 * EntryService
 * Handles journal entry management operations including CRUD operations with ownership verification
 */

export class EntryService {
  /**
   * Validate entry title
   * @param title - The title to validate
   * @returns True if title is valid, false otherwise
   */
  private validateTitle(title: string): boolean {
    return !!(title && title.trim().length > 0 && title.trim().length <= 255);
  }

  /**
   * Validate entry content
   * @param content - The content to validate
   * @returns True if content is valid, false otherwise
   */
  private validateContent(content: string): boolean {
    return !!(content && content.trim().length > 0);
  }

  /**
   * Validate mood (if provided)
   * @param mood - The mood to validate
   * @returns True if mood is valid, false otherwise
   */
  private validateMood(mood?: string): boolean {
    if (!mood) return true; // mood is optional
    const validMoods = ['happy', 'sad', 'anxious', 'calm', 'angry', 'neutral'];
    return validMoods.includes(mood.toLowerCase());
  }

  /**
   * Validate tags (if provided)
   * @param tags - The tags array to validate
   * @returns True if tags are valid, false otherwise
   */
  private validateTags(tags?: string[]): boolean {
    if (!tags) return true; // tags are optional
    if (!Array.isArray(tags)) return false;
    return tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0);
  }

  /**
   * Create a new journal entry with validation
   * @param userId - The user's ID
   * @param createData - The entry data to create
   * @returns The created journal entry
   * @throws Error if validation fails
   */
  async createEntry(userId: string, createData: CreateEntryRequest): Promise<JournalEntry> {
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate title
    if (!this.validateTitle(createData.title)) {
      throw new Error('Title is required and must be between 1 and 255 characters');
    }

    // Validate content
    if (!this.validateContent(createData.content)) {
      throw new Error('Content is required and cannot be empty');
    }

    // Validate mood if provided
    if (createData.mood && !this.validateMood(createData.mood)) {
      throw new Error('Invalid mood value');
    }

    // Validate tags if provided
    if (createData.tags && !this.validateTags(createData.tags)) {
      throw new Error('Tags must be an array of non-empty strings');
    }

    // Create entry in repository
    const entry = await EntryRepository.create(
      userId,
      createData.title.trim(),
      createData.content.trim(),
      createData.mood?.toLowerCase(),
      createData.tags?.map((tag) => tag.trim())
    );

    if (process.env.NODE_ENV !== 'test') {
      try {
        await enqueueEntryAnalysis({
          entryId: entry.id,
          userId,
          title: entry.title,
          content: entry.content,
        });
      } catch (error) {
        logger.warn('Failed to enqueue entry analysis job', {
          entryId: entry.id,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return entry;
  }

  /**
   * Get a specific journal entry with ownership verification
   * @param entryId - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @returns The journal entry if found and owned by user
   * @throws Error if entry not found or access denied
   */
  async getEntry(entryId: string, userId: string): Promise<JournalEntry> {
    // Validate inputs
    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Find entry with ownership check
    const entry = await EntryRepository.findById(entryId, userId);

    if (!entry) {
      throw new Error('Entry not found or access denied');
    }

    return entry;
  }

  /**
   * Get all journal entries for a user with pagination support
   * @param userId - The user's ID
   * @param page - The page number (1-indexed)
   * @param limit - The number of entries per page
   * @param sortBy - The field to sort by (default: createdAt)
   * @param order - The sort order (default: desc)
   * @returns Paginated list of journal entries
   * @throws Error if user ID is missing
   */
  async getUserEntries(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<JournalEntry>> {
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate pagination parameters
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Fetch entries from repository
    const result = await EntryRepository.findByUserId(userId, page, limit, sortBy, order);

    return result;
  }

  /**
   * Update a journal entry with ownership verification
   * @param entryId - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @param updateData - The data to update
   * @returns The updated journal entry
   * @throws Error if entry not found, access denied, or validation fails
   */
  async updateEntry(
    entryId: string,
    userId: string,
    updateData: UpdateEntryRequest
  ): Promise<JournalEntry> {
    // Validate inputs
    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify entry exists and user owns it
    const entry = await EntryRepository.findById(entryId, userId);
    if (!entry) {
      throw new Error('Entry not found or access denied');
    }

    // Validate update data
    const updatePayload: {
      title?: string;
      content?: string;
      mood?: string;
      tags?: string[];
    } = {};

    if (updateData.title !== undefined) {
      if (!this.validateTitle(updateData.title)) {
        throw new Error('Title must be between 1 and 255 characters');
      }
      updatePayload.title = updateData.title.trim();
    }

    if (updateData.content !== undefined) {
      if (!this.validateContent(updateData.content)) {
        throw new Error('Content cannot be empty');
      }
      updatePayload.content = updateData.content.trim();
    }

    if (updateData.mood !== undefined) {
      if (!this.validateMood(updateData.mood)) {
        throw new Error('Invalid mood value');
      }
      updatePayload.mood = updateData.mood.toLowerCase();
    }

    if (updateData.tags !== undefined) {
      if (!this.validateTags(updateData.tags)) {
        throw new Error('Tags must be an array of non-empty strings');
      }
      updatePayload.tags = updateData.tags.map((tag) => tag.trim());
    }

    // If no valid updates, return current entry
    if (Object.keys(updatePayload).length === 0) {
      return entry;
    }

    // Update entry in repository
    const updatedEntry = await EntryRepository.update(entryId, userId, updatePayload);

    return updatedEntry;
  }

  /**
   * Delete a journal entry with ownership verification
   * @param entryId - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @returns true if deleted successfully
   * @throws Error if entry not found or access denied
   */
  async deleteEntry(entryId: string, userId: string): Promise<boolean> {
    // Validate inputs
    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify entry exists and user owns it
    const entry = await EntryRepository.findById(entryId, userId);
    if (!entry) {
      throw new Error('Entry not found or access denied');
    }

    // Delete entry from repository
    const deleted = await EntryRepository.delete(entryId, userId);

    if (!deleted) {
      throw new Error('Failed to delete entry');
    }

    return true;
  }
}

export default new EntryService();
