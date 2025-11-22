import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-End Tests for Journal Entry Operations
 * 
 * These tests verify the complete journal entry workflows:
 * - Create entry flow
 * - List entries with pagination
 * - Get specific entry
 * - Update entry
 * - Delete entry
 * - Access control and authorization
 * 
 * Requirements: 7.2, 7.4
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running
 * 2. Run: npm test -- e2e-entries.test.ts
 */

describe('E2E Tests - Journal Entry Operations', () => {
  let dbConnected = false;
  let accessToken: string;
  let userId: string;
  let entryId: string;

  const testUser = {
    email: 'e2e-entries-test@example.com',
    password: 'E2EEntriesPassword123!',
    name: 'E2E Entries Test User',
  };

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;

      // Clean up test data before running tests
      await prisma.journalEntry.deleteMany({
        where: { user: { email: testUser.email } },
      });
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });

      // Register and login test user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      accessToken = registerResponse.body.data.accessToken;
      userId = registerResponse.body.data.user.id;
    } catch (error) {
      console.warn(
        '\n⚠️  Database not available for E2E entry tests.\n' +
        'To run E2E tests, ensure PostgreSQL is running.\n'
      );
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        // Clean up test data after running tests
        await prisma.journalEntry.deleteMany({
          where: { user: { email: testUser.email } },
        });
        await prisma.user.deleteMany({
          where: { email: testUser.email },
        });
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    }
    await prisma.$disconnect();
  });

  const describeIfDb = dbConnected ? describe : describe.skip;

  describeIfDb('Create Entry Flow', () => {
    it('should create a journal entry with all fields', async () => {
      const entryData = {
        title: 'My First Journal Entry',
        content: 'This is a detailed journal entry about my day',
        mood: 'happy',
        tags: ['reflection', 'gratitude'],
      };

      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(entryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(entryData.title);
      expect(response.body.data.content).toBe(entryData.content);
      expect(response.body.data.mood).toBe(entryData.mood);
      expect(response.body.data.tags).toEqual(entryData.tags);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      // Store entry ID for subsequent tests
      entryId = response.body.data.id;
    });

    it('should create a journal entry with only required fields', async () => {
      const entryData = {
        title: 'Simple Entry',
        content: 'Just the essentials',
      };

      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(entryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(entryData.title);
      expect(response.body.data.content).toBe(entryData.content);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Content without title',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Title without content',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          content: 'Some content',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is empty string', async () => {
      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Some title',
          content: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when mood is invalid', async () => {
      const response = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Entry with invalid mood',
          content: 'Some content',
          mood: 'invalid-mood',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({
          title: 'Entry',
          content: 'Content',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('List Entries with Pagination', () => {
    it('should list entries with default pagination', async () => {
      const response = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should list entries with custom page and limit', async () => {
      const response = await request(app)
        .get('/api/entries?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should list entries sorted by createdAt descending', async () => {
      const response = await request(app)
        .get('/api/entries?sortBy=createdAt&order=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const entries = response.body.data.data;
      if (entries.length > 1) {
        for (let i = 0; i < entries.length - 1; i++) {
          const current = new Date(entries[i].createdAt).getTime();
          const next = new Date(entries[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('should list entries sorted by createdAt ascending', async () => {
      const response = await request(app)
        .get('/api/entries?sortBy=createdAt&order=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const entries = response.body.data.data;
      if (entries.length > 1) {
        for (let i = 0; i < entries.length - 1; i++) {
          const current = new Date(entries[i].createdAt).getTime();
          const next = new Date(entries[i + 1].createdAt).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    it('should list entries sorted by updatedAt', async () => {
      const response = await request(app)
        .get('/api/entries?sortBy=updatedAt&order=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
    });

    it('should return 400 when page is less than 1', async () => {
      const response = await request(app)
        .get('/api/entries?page=0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when limit is less than 1', async () => {
      const response = await request(app)
        .get('/api/entries?limit=0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when limit exceeds 100', async () => {
      const response = await request(app)
        .get('/api/entries?limit=101')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when sortBy is invalid', async () => {
      const response = await request(app)
        .get('/api/entries?sortBy=invalidField')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when order is invalid', async () => {
      const response = await request(app)
        .get('/api/entries?order=invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .get('/api/entries')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should only return entries belonging to authenticated user', async () => {
      const response = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const entries = response.body.data.data;
      entries.forEach((entry: any) => {
        expect(entry.userId).toBe(userId);
      });
    });
  });

  describeIfDb('Get Specific Entry', () => {
    it('should get a specific entry successfully', async () => {
      const response = await request(app)
        .get(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(entryId);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should return 404 when entry does not exist', async () => {
      const response = await request(app)
        .get('/api/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .get(`/api/entries/${entryId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Update Entry', () => {
    it('should update entry title', async () => {
      const updateData = {
        title: 'Updated Entry Title',
      };

      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(entryId);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should update entry content', async () => {
      const updateData = {
        content: 'Updated content with new information',
      };

      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
    });

    it('should update entry mood', async () => {
      const updateData = {
        mood: 'calm',
      };

      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mood).toBe(updateData.mood);
    });

    it('should update entry tags', async () => {
      const updateData = {
        tags: ['updated', 'tags', 'here'],
      };

      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(updateData.tags);
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        title: 'Fully Updated Entry',
        content: 'Completely new content',
        mood: 'happy',
        tags: ['updated', 'complete'],
      };

      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.mood).toBe(updateData.mood);
      expect(response.body.data.tags).toEqual(updateData.tags);
    });

    it('should return 400 when no fields are provided', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is empty string', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when mood is invalid', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ mood: 'invalid-mood' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 when entry does not exist', async () => {
      const response = await request(app)
        .put('/api/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .send({ title: 'New Title' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .put(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'New Title' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Delete Entry', () => {
    it('should delete entry successfully', async () => {
      // Create an entry to delete
      const createResponse = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Entry to Delete',
          content: 'This entry will be deleted',
        });

      const entryToDeleteId = createResponse.body.data.id;

      // Delete the entry
      const response = await request(app)
        .delete(`/api/entries/${entryToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify entry is deleted
      const getResponse = await request(app)
        .get(`/api/entries/${entryToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should return 404 when entry does not exist', async () => {
      const response = await request(app)
        .delete('/api/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .delete(`/api/entries/${entryId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .delete(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Access Control and Authorization', () => {
    let secondUserToken: string;
    let secondUserId: string;
    let secondUserEntryId: string;

    beforeAll(async () => {
      // Create a second user
      const secondUser = {
        email: 'e2e-entries-second-user@example.com',
        password: 'SecondUserPassword123!',
        name: 'Second User for Entries',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(secondUser);

      secondUserToken = registerResponse.body.data.accessToken;
      secondUserId = registerResponse.body.data.user.id;

      // Create an entry for the second user
      const entryResponse = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          title: 'Second User Entry',
          content: 'This entry belongs to the second user',
          mood: 'neutral',
        });

      secondUserEntryId = entryResponse.body.data.id;
    });

    afterAll(async () => {
      // Clean up second user
      await prisma.journalEntry.deleteMany({
        where: { userId: secondUserId },
      });
      await prisma.user.deleteMany({
        where: { id: secondUserId },
      });
    });

    it('should not allow user to access another user\'s entry', async () => {
      const response = await request(app)
        .get(`/api/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should not allow user to update another user\'s entry', async () => {
      const response = await request(app)
        .put(`/api/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should not allow user to delete another user\'s entry', async () => {
      const response = await request(app)
        .delete(`/api/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should only return entries belonging to authenticated user', async () => {
      const response = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const entries = response.body.data.data;
      entries.forEach((entry: any) => {
        expect(entry.userId).toBe(userId);
      });
    });
  });

  describeIfDb('Complete Journal Entry Workflow', () => {
    it('should complete full entry workflow: create → list → get → update → delete', async () => {
      // Step 1: Create entry
      const createResponse = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Workflow Test Entry',
          content: 'Testing complete workflow',
          mood: 'happy',
          tags: ['workflow', 'test'],
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const workflowEntryId = createResponse.body.data.id;

      // Step 2: List entries and verify new entry is present
      const listResponse = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      const entryExists = listResponse.body.data.data.some(
        (entry: any) => entry.id === workflowEntryId
      );
      expect(entryExists).toBe(true);

      // Step 3: Get specific entry
      const getResponse = await request(app)
        .get(`/api/entries/${workflowEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(workflowEntryId);
      expect(getResponse.body.data.title).toBe('Workflow Test Entry');

      // Step 4: Update entry
      const updateResponse = await request(app)
        .put(`/api/entries/${workflowEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Workflow Entry',
          mood: 'calm',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Workflow Entry');
      expect(updateResponse.body.data.mood).toBe('calm');

      // Step 5: Verify update persisted
      const verifyResponse = await request(app)
        .get(`/api/entries/${workflowEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(verifyResponse.body.data.title).toBe('Updated Workflow Entry');

      // Step 6: Delete entry
      const deleteResponse = await request(app)
        .delete(`/api/entries/${workflowEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      expect(deleteResponse.body).toEqual({});

      // Step 7: Verify entry is deleted
      const deletedResponse = await request(app)
        .get(`/api/entries/${workflowEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(deletedResponse.body.success).toBe(false);
    });
  });
});
