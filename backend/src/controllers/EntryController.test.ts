import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ApiError } from '../middleware/errorHandler.js';
import EntryController from './EntryController.js';
import EntryService from '../services/EntryService.js';

// Mock EntryService
jest.mock('../services/EntryService.js');

describe('EntryController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      user: {
        userId: 'user-123',
        email: 'user@example.com',
      },
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('createEntry', () => {
    it('should create entry successfully', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
        mood: 'happy',
        tags: ['work', 'personal'],
      };

      const mockEntry = {
        id: 'entry-123',
        userId: 'user-123',
        title: 'My Day',
        content: 'Today was great',
        mood: 'happy',
        tags: ['work', 'personal'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (EntryService.createEntry as jest.Mock).mockResolvedValue(mockEntry);

      await EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.createEntry).toHaveBeenCalledWith('user-123', {
        title: 'My Day',
        content: 'Today was great',
        mood: 'happy',
        tags: ['work', 'personal'],
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEntry,
        })
      );
    });

    it('should create entry without optional fields', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
      };

      const mockEntry = {
        id: 'entry-123',
        userId: 'user-123',
        title: 'My Day',
        content: 'Today was great',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (EntryService.createEntry as jest.Mock).mockResolvedValue(mockEntry);

      await EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.createEntry).toHaveBeenCalledWith('user-123', {
        title: 'My Day',
        content: 'Today was great',
        mood: undefined,
        tags: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should reject when title is missing', async () => {
      mockReq.body = { content: 'Today was great' };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when content is missing', async () => {
      mockReq.body = { title: 'My Day' };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when title is not a string', async () => {
      mockReq.body = {
        title: 123,
        content: 'Today was great',
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when content is not a string', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 123,
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when mood is not a string', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
        mood: 123,
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when tags is not an array', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
        tags: 'not-an-array',
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when tags contains non-strings', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
        tags: ['work', 123],
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
      };

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.createEntry).not.toHaveBeenCalled();
    });

    it('should handle service validation errors', async () => {
      mockReq.body = {
        title: 'My Day',
        content: 'Today was great',
      };

      (EntryService.createEntry as jest.Mock).mockRejectedValue(
        new Error('Title is required and must be between 1 and 255 characters')
      );

      await expect(
        EntryController.createEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getUserEntries', () => {
    it('should get user entries with default pagination', async () => {
      mockReq.query = {};

      const mockResult = {
        data: [
          {
            id: 'entry-123',
            userId: 'user-123',
            title: 'My Day',
            content: 'Today was great',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      (EntryService.getUserEntries as jest.Mock).mockResolvedValue(mockResult);

      await EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.getUserEntries).toHaveBeenCalledWith('user-123', 1, 10, 'createdAt', 'desc');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResult,
        })
      );
    });

    it('should get user entries with custom pagination', async () => {
      mockReq.query = {
        page: '2',
        limit: '20',
        sortBy: 'updatedAt',
        order: 'asc',
      };

      const mockResult = {
        data: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
      };

      (EntryService.getUserEntries as jest.Mock).mockResolvedValue(mockResult);

      await EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.getUserEntries).toHaveBeenCalledWith('user-123', 2, 20, 'updatedAt', 'asc');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject when page is less than 1', async () => {
      mockReq.query = { page: '0' };

      let errorThrown = false;
      try {
        await EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response);
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toContain('Page must be greater than 0');
      }

      expect(errorThrown).toBe(true);
      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });

    it('should reject when limit is less than 1', async () => {
      mockReq.query = { limit: '0' };

      let errorThrown = false;
      try {
        await EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response);
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toContain('Limit must be between 1 and 100');
      }

      expect(errorThrown).toBe(true);
      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });

    it('should reject when limit exceeds 100', async () => {
      mockReq.query = { limit: '101' };

      await expect(
        EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });

    it('should reject when sortBy is invalid', async () => {
      mockReq.query = { sortBy: 'invalid' };

      await expect(
        EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });

    it('should reject when order is invalid', async () => {
      mockReq.query = { order: 'invalid' };

      await expect(
        EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;

      await expect(
        EntryController.getUserEntries(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getUserEntries).not.toHaveBeenCalled();
    });
  });

  describe('getEntry', () => {
    it('should get entry successfully', async () => {
      mockReq.params = { id: 'entry-123' };

      const mockEntry = {
        id: 'entry-123',
        userId: 'user-123',
        title: 'My Day',
        content: 'Today was great',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (EntryService.getEntry as jest.Mock).mockResolvedValue(mockEntry);

      await EntryController.getEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.getEntry).toHaveBeenCalledWith('entry-123', 'user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEntry,
        })
      );
    });

    it('should reject when entry ID is missing', async () => {
      mockReq.params = {};

      await expect(
        EntryController.getEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getEntry).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'entry-123' };

      await expect(
        EntryController.getEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.getEntry).not.toHaveBeenCalled();
    });

    it('should handle access denied error', async () => {
      mockReq.params = { id: 'entry-123' };

      (EntryService.getEntry as jest.Mock).mockRejectedValue(
        new Error('Entry not found or access denied')
      );

      await expect(
        EntryController.getEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle entry not found error', async () => {
      mockReq.params = { id: 'nonexistent' };

      (EntryService.getEntry as jest.Mock).mockRejectedValue(
        new Error('Entry not found')
      );

      await expect(
        EntryController.getEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateEntry', () => {
    it('should update entry successfully', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockEntry = {
        id: 'entry-123',
        userId: 'user-123',
        title: 'Updated Title',
        content: 'Updated content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (EntryService.updateEntry as jest.Mock).mockResolvedValue(mockEntry);

      await EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.updateEntry).toHaveBeenCalledWith('entry-123', 'user-123', {
        title: 'Updated Title',
        content: 'Updated content',
        mood: undefined,
        tags: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEntry,
        })
      );
    });

    it('should update only title', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { title: 'Updated Title' };

      const mockEntry = {
        id: 'entry-123',
        userId: 'user-123',
        title: 'Updated Title',
        content: 'Original content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (EntryService.updateEntry as jest.Mock).mockResolvedValue(mockEntry);

      await EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.updateEntry).toHaveBeenCalledWith('entry-123', 'user-123', {
        title: 'Updated Title',
        content: undefined,
        mood: undefined,
        tags: undefined,
      });
    });

    it('should reject when entry ID is missing', async () => {
      mockReq.params = {};
      mockReq.body = { title: 'Updated Title' };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when no fields are provided', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = {};

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when title is not a string', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { title: 123 };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when content is not a string', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { content: 123 };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when mood is not a string', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { mood: 123 };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when tags is not an array', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { tags: 'not-an-array' };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { title: 'Updated Title' };

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.updateEntry).not.toHaveBeenCalled();
    });

    it('should handle access denied error', async () => {
      mockReq.params = { id: 'entry-123' };
      mockReq.body = { title: 'Updated Title' };

      (EntryService.updateEntry as jest.Mock).mockRejectedValue(
        new Error('Entry not found or access denied')
      );

      await expect(
        EntryController.updateEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      mockReq.params = { id: 'entry-123' };

      (EntryService.deleteEntry as jest.Mock).mockResolvedValue(true);

      await EntryController.deleteEntry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(EntryService.deleteEntry).toHaveBeenCalledWith('entry-123', 'user-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should reject when entry ID is missing', async () => {
      mockReq.params = {};

      await expect(
        EntryController.deleteEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.deleteEntry).not.toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'entry-123' };

      await expect(
        EntryController.deleteEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);

      expect(EntryService.deleteEntry).not.toHaveBeenCalled();
    });

    it('should handle access denied error', async () => {
      mockReq.params = { id: 'entry-123' };

      (EntryService.deleteEntry as jest.Mock).mockRejectedValue(
        new Error('Entry not found or access denied')
      );

      await expect(
        EntryController.deleteEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });

    it('should handle entry not found error', async () => {
      mockReq.params = { id: 'nonexistent' };

      (EntryService.deleteEntry as jest.Mock).mockRejectedValue(
        new Error('Entry not found')
      );

      await expect(
        EntryController.deleteEntry(mockReq as AuthenticatedRequest, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });
});
