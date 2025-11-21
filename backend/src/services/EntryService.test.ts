import { EntryService } from './EntryService.js';
import EntryRepository from '../repositories/EntryRepository.js';

// Mock dependencies
jest.mock('../repositories/EntryRepository.js');

describe('EntryService', () => {
  let entryService: EntryService;
  const userId = 'user-123';
  const entryId = 'entry-456';

  beforeEach(() => {
    entryService = new EntryService();
    jest.clearAllMocks();
  });

  describe('createEntry', () => {
    const validCreateData = {
      title: 'My First Entry',
      content: 'This is my first journal entry',
      mood: 'happy',
      tags: ['wellness', 'reflection'],
    };

    it('should successfully create a new entry', async () => {
      const mockEntry = {
        id: entryId,
        userId,
        title: validCreateData.title,
        content: validCreateData.content,
        mood: validCreateData.mood,
        tags: validCreateData.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await entryService.createEntry(userId, validCreateData);

      expect(result).toEqual(mockEntry);
      expect(EntryRepository.create).toHaveBeenCalledWith(
        userId,
        validCreateData.title,
        validCreateData.content,
        validCreateData.mood,
        validCreateData.tags
      );
    });

    it('should create entry without optional mood and tags', async () => {
      const createData = {
        title: 'Simple Entry',
        content: 'Just title and content',
      };

      const mockEntry = {
        id: entryId,
        userId,
        title: createData.title,
        content: createData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await entryService.createEntry(userId, createData);

      expect(result).toEqual(mockEntry);
      expect(EntryRepository.create).toHaveBeenCalledWith(userId, createData.title, createData.content, undefined, undefined);
    });

    it('should reject creation with missing user ID', async () => {
      await expect(entryService.createEntry('', validCreateData)).rejects.toThrow('User ID is required');
    });

    it('should reject creation with missing title', async () => {
      const invalidData = { ...validCreateData, title: '' };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Title is required and must be between 1 and 255 characters'
      );
    });

    it('should reject creation with empty title (whitespace only)', async () => {
      const invalidData = { ...validCreateData, title: '   ' };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Title is required and must be between 1 and 255 characters'
      );
    });

    it('should reject creation with title exceeding 255 characters', async () => {
      const invalidData = { ...validCreateData, title: 'a'.repeat(256) };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Title is required and must be between 1 and 255 characters'
      );
    });

    it('should reject creation with missing content', async () => {
      const invalidData = { ...validCreateData, content: '' };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Content is required and cannot be empty'
      );
    });

    it('should reject creation with empty content (whitespace only)', async () => {
      const invalidData = { ...validCreateData, content: '   ' };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Content is required and cannot be empty'
      );
    });

    it('should reject creation with invalid mood', async () => {
      const invalidData = { ...validCreateData, mood: 'invalid-mood' };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow('Invalid mood value');
    });

    it('should accept valid mood values', async () => {
      const validMoods = ['happy', 'sad', 'anxious', 'calm', 'angry', 'neutral'];

      for (const mood of validMoods) {
        const createData = { ...validCreateData, mood };
        const mockEntry = {
          id: entryId,
          userId,
          title: createData.title,
          content: createData.content,
          mood,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (EntryRepository.create as jest.Mock).mockResolvedValue(mockEntry);

        const result = await entryService.createEntry(userId, createData);
        expect(result.mood).toBe(mood);
      }
    });

    it('should reject creation with invalid tags (not an array)', async () => {
      const invalidData = { ...validCreateData, tags: 'not-an-array' as any };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Tags must be an array of non-empty strings'
      );
    });

    it('should reject creation with empty tag strings', async () => {
      const invalidData = { ...validCreateData, tags: ['valid-tag', '', 'another-tag'] };
      await expect(entryService.createEntry(userId, invalidData)).rejects.toThrow(
        'Tags must be an array of non-empty strings'
      );
    });

    it('should trim whitespace from title and content', async () => {
      const createData = {
        title: '  My Entry  ',
        content: '  Entry content  ',
      };

      const mockEntry = {
        id: entryId,
        userId,
        title: 'My Entry',
        content: 'Entry content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.create as jest.Mock).mockResolvedValue(mockEntry);

      await entryService.createEntry(userId, createData);

      expect(EntryRepository.create).toHaveBeenCalledWith(userId, 'My Entry', 'Entry content', undefined, undefined);
    });

    it('should lowercase mood value', async () => {
      const createData = { ...validCreateData, mood: 'HAPPY' };

      const mockEntry = {
        id: entryId,
        userId,
        title: createData.title,
        content: createData.content,
        mood: 'happy',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.create as jest.Mock).mockResolvedValue(mockEntry);

      await entryService.createEntry(userId, createData);

      expect(EntryRepository.create).toHaveBeenCalledWith(
        userId,
        createData.title,
        createData.content,
        'happy',
        validCreateData.tags
      );
    });

    it('should handle repository errors', async () => {
      (EntryRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.createEntry(userId, validCreateData)).rejects.toThrow('Database error');
    });
  });

  describe('getEntry', () => {
    it('should successfully retrieve an entry', async () => {
      const mockEntry = {
        id: entryId,
        userId,
        title: 'My Entry',
        content: 'Entry content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(mockEntry);

      const result = await entryService.getEntry(entryId, userId);

      expect(result).toEqual(mockEntry);
      expect(EntryRepository.findById).toHaveBeenCalledWith(entryId, userId);
    });

    it('should reject retrieval with missing entry ID', async () => {
      await expect(entryService.getEntry('', userId)).rejects.toThrow('Entry ID is required');
    });

    it('should reject retrieval with missing user ID', async () => {
      await expect(entryService.getEntry(entryId, '')).rejects.toThrow('User ID is required');
    });

    it('should reject retrieval when entry not found', async () => {
      (EntryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(entryService.getEntry(entryId, userId)).rejects.toThrow(
        'Entry not found or access denied'
      );
    });

    it('should reject retrieval when user does not own entry', async () => {
      (EntryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(entryService.getEntry(entryId, 'different-user')).rejects.toThrow(
        'Entry not found or access denied'
      );
    });

    it('should handle repository errors', async () => {
      (EntryRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.getEntry(entryId, userId)).rejects.toThrow('Database error');
    });
  });

  describe('getUserEntries', () => {
    it('should successfully retrieve paginated entries', async () => {
      const mockResponse = {
        data: [
          {
            id: 'entry-1',
            userId,
            title: 'Entry 1',
            content: 'Content 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'entry-2',
            userId,
            title: 'Entry 2',
            content: 'Content 2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      (EntryRepository.findByUserId as jest.Mock).mockResolvedValue(mockResponse);

      const result = await entryService.getUserEntries(userId);

      expect(result).toEqual(mockResponse);
      expect(EntryRepository.findByUserId).toHaveBeenCalledWith(userId, 1, 10, 'createdAt', 'desc');
    });

    it('should retrieve entries with custom pagination parameters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 2,
        limit: 5,
        totalPages: 0,
      };

      (EntryRepository.findByUserId as jest.Mock).mockResolvedValue(mockResponse);

      const result = await entryService.getUserEntries(userId, 2, 5, 'updatedAt', 'asc');

      expect(result).toEqual(mockResponse);
      expect(EntryRepository.findByUserId).toHaveBeenCalledWith(userId, 2, 5, 'updatedAt', 'asc');
    });

    it('should reject retrieval with missing user ID', async () => {
      await expect(entryService.getUserEntries('')).rejects.toThrow('User ID is required');
    });

    it('should reject retrieval with invalid page number', async () => {
      await expect(entryService.getUserEntries(userId, 0)).rejects.toThrow(
        'Page must be greater than 0'
      );
    });

    it('should reject retrieval with invalid limit (too low)', async () => {
      await expect(entryService.getUserEntries(userId, 1, 0)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should reject retrieval with invalid limit (too high)', async () => {
      await expect(entryService.getUserEntries(userId, 1, 101)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should handle repository errors', async () => {
      (EntryRepository.findByUserId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.getUserEntries(userId)).rejects.toThrow('Database error');
    });
  });

  describe('updateEntry', () => {
    const validUpdateData = {
      title: 'Updated Title',
      content: 'Updated content',
      mood: 'calm',
      tags: ['updated', 'tags'],
    };

    it('should successfully update an entry', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEntry = {
        ...existingEntry,
        ...validUpdateData,
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);
      (EntryRepository.update as jest.Mock).mockResolvedValue(updatedEntry);

      const result = await entryService.updateEntry(entryId, userId, validUpdateData);

      expect(result).toEqual(updatedEntry);
      expect(EntryRepository.update).toHaveBeenCalledWith(entryId, userId, validUpdateData);
    });

    it('should update only provided fields', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const partialUpdate = { title: 'New Title' };
      const updatedEntry = { ...existingEntry, ...partialUpdate };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);
      (EntryRepository.update as jest.Mock).mockResolvedValue(updatedEntry);

      const result = await entryService.updateEntry(entryId, userId, partialUpdate);

      expect(result).toEqual(updatedEntry);
      expect(EntryRepository.update).toHaveBeenCalledWith(entryId, userId, partialUpdate);
    });

    it('should return existing entry if no updates provided', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);

      const result = await entryService.updateEntry(entryId, userId, {});

      expect(result).toEqual(existingEntry);
      expect(EntryRepository.update).not.toHaveBeenCalled();
    });

    it('should reject update with missing entry ID', async () => {
      await expect(entryService.updateEntry('', userId, validUpdateData)).rejects.toThrow(
        'Entry ID is required'
      );
    });

    it('should reject update with missing user ID', async () => {
      await expect(entryService.updateEntry(entryId, '', validUpdateData)).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should reject update when entry not found', async () => {
      (EntryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(entryService.updateEntry(entryId, userId, validUpdateData)).rejects.toThrow(
        'Entry not found or access denied'
      );
    });

    it('should reject update with invalid title', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);

      await expect(
        entryService.updateEntry(entryId, userId, { title: '' })
      ).rejects.toThrow('Title must be between 1 and 255 characters');
    });

    it('should reject update with invalid content', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);

      await expect(
        entryService.updateEntry(entryId, userId, { content: '   ' })
      ).rejects.toThrow('Content cannot be empty');
    });

    it('should reject update with invalid mood', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);

      await expect(
        entryService.updateEntry(entryId, userId, { mood: 'invalid' })
      ).rejects.toThrow('Invalid mood value');
    });

    it('should reject update with invalid tags', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);

      await expect(
        entryService.updateEntry(entryId, userId, { tags: ['', 'valid'] })
      ).rejects.toThrow('Tags must be an array of non-empty strings');
    });

    it('should handle repository errors', async () => {
      (EntryRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.updateEntry(entryId, userId, validUpdateData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('deleteEntry', () => {
    it('should successfully delete an entry', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Entry to Delete',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);
      (EntryRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await entryService.deleteEntry(entryId, userId);

      expect(result).toBe(true);
      expect(EntryRepository.delete).toHaveBeenCalledWith(entryId, userId);
    });

    it('should reject deletion with missing entry ID', async () => {
      await expect(entryService.deleteEntry('', userId)).rejects.toThrow('Entry ID is required');
    });

    it('should reject deletion with missing user ID', async () => {
      await expect(entryService.deleteEntry(entryId, '')).rejects.toThrow('User ID is required');
    });

    it('should reject deletion when entry not found', async () => {
      (EntryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow(
        'Entry not found or access denied'
      );
    });

    it('should reject deletion when user does not own entry', async () => {
      (EntryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(entryService.deleteEntry(entryId, 'different-user')).rejects.toThrow(
        'Entry not found or access denied'
      );
    });

    it('should handle repository errors during ownership check', async () => {
      (EntryRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow('Database error');
    });

    it('should handle repository errors during deletion', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Entry to Delete',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);
      (EntryRepository.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow('Database error');
    });

    it('should handle deletion failure', async () => {
      const existingEntry = {
        id: entryId,
        userId,
        title: 'Entry to Delete',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(existingEntry);
      (EntryRepository.delete as jest.Mock).mockResolvedValue(false);

      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow('Failed to delete entry');
    });
  });

  describe('Integration: CRUD Operations', () => {
    it('should create, retrieve, update, and delete an entry', async () => {
      const createData = {
        title: 'My Journal Entry',
        content: 'This is my entry',
        mood: 'happy',
      };

      // Create
      const createdEntry = {
        id: entryId,
        userId,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (EntryRepository.create as jest.Mock).mockResolvedValue(createdEntry);
      const created = await entryService.createEntry(userId, createData);
      expect(created.id).toBe(entryId);

      // Retrieve
      (EntryRepository.findById as jest.Mock).mockResolvedValue(createdEntry);
      const retrieved = await entryService.getEntry(entryId, userId);
      expect(retrieved.title).toBe(createData.title);

      // Update
      const updateData = { title: 'Updated Title' };
      const updatedEntry = { ...createdEntry, ...updateData };

      (EntryRepository.findById as jest.Mock).mockResolvedValue(createdEntry);
      (EntryRepository.update as jest.Mock).mockResolvedValue(updatedEntry);
      const updated = await entryService.updateEntry(entryId, userId, updateData);
      expect(updated.title).toBe('Updated Title');

      // Delete
      (EntryRepository.findById as jest.Mock).mockResolvedValue(updatedEntry);
      (EntryRepository.delete as jest.Mock).mockResolvedValue(true);
      const deleted = await entryService.deleteEntry(entryId, userId);
      expect(deleted).toBe(true);
    });
  });
});
