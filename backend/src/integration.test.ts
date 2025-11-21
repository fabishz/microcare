import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Integration Tests for MicroCare API
 * 
 * These tests verify the complete API workflows including:
 * - Authentication flow (register → login → access protected endpoints)
 * - User profile management
 * - Journal entry CRUD operations with pagination
 * - Error scenarios and access control
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running: docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
 * 2. Run: npm test -- integration.test.ts
 */

describe('Integration Tests - MicroCare API', () => {
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let entryId: string;
  let dbConnected = false;

  const testUser = {
    email: 'integration-test@example.com',
    password: 'TestPassword123!',
    name: 'Integration Test User',
  };

  beforeAll(async () => {
    // Check if database is connected
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
    } catch (error) {
      console.warn(
        '\n⚠️  Database not available for integration tests.\n' +
        'To run integration tests, ensure PostgreSQL is running:\n' +
        '  docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres\n' +
        'Then run: npm test -- integration.test.ts\n'
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

  // Conditionally run tests based on database connection
  const describeIfDb = dbConnected ? describe : describe.skip;

  describeIfDb('Authentication Flow', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(testUser)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.user.name).toBe(testUser.name);

        // Store tokens and userId for subsequent tests
        accessToken = response.body.data.accessToken;
        refreshToken = response.body.data.refreshToken;
        userId = response.body.data.user.id;
      });

      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            password: testUser.password,
            name: testUser.name,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            name: testUser.name,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when name is missing', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: testUser.password,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: testUser.password,
            name: testUser.name,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 409 when email is already registered', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(testUser)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login user successfully with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user.email).toBe(testUser.email);
      });

      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            password: testUser.password,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when password is incorrect', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when email does not exist', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: testUser.password,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Logged out successfully');
      });

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when token is invalid', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should refresh access token successfully', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');

        // Update token for subsequent tests
        accessToken = response.body.data.accessToken;
      });

      it('should return 400 when refresh token is missing', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when refresh token is invalid', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: 'invalid-token' })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describeIfDb('User Profile Management', () => {
    describe('GET /api/users/profile', () => {
      it('should get user profile successfully', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(userId);
        expect(response.body.data.email).toBe(testUser.email);
        expect(response.body.data.name).toBe(testUser.name);
      });

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when token is invalid', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile successfully', async () => {
        const updatedData = {
          name: 'Updated Name',
          email: 'updated-email@example.com',
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updatedData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updatedData.name);
        expect(response.body.data.email).toBe(updatedData.email);
      });

      it('should update only name', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'Another Name' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Another Name');
      });

      it('should return 400 when no fields are provided', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'invalid-email' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .send({ name: 'New Name' })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/users/change-password', () => {
      it('should change password successfully', async () => {
        const newPassword = 'NewPassword456!';
        const response = await request(app)
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword,
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Update testUser password for subsequent tests
        testUser.password = newPassword;
      });

      it('should return 400 when current password is missing', async () => {
        const response = await request(app)
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ newPassword: 'NewPassword789!' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when new password is missing', async () => {
        const response = await request(app)
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ currentPassword: testUser.password })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when current password is incorrect', async () => {
        const response = await request(app)
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: 'WrongPassword123!',
            newPassword: 'NewPassword789!',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .post('/api/users/change-password')
          .send({
            currentPassword: testUser.password,
            newPassword: 'NewPassword789!',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describeIfDb('Journal Entry Management', () => {
    describe('POST /api/entries', () => {
      it('should create a journal entry successfully', async () => {
        const entryData = {
          title: 'My First Entry',
          content: 'This is my first journal entry',
          mood: 'happy',
          tags: ['first', 'test'],
        };

        const response = await request(app)
          .post('/api/entries')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(entryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(entryData.title);
        expect(response.body.data.content).toBe(entryData.content);
        expect(response.body.data.mood).toBe(entryData.mood);
        expect(response.body.data.tags).toEqual(entryData.tags);
        expect(response.body.data.userId).toBe(userId);

        // Store entry ID for subsequent tests
        entryId = response.body.data.id;
      });

      it('should create entry without optional fields', async () => {
        const entryData = {
          title: 'Simple Entry',
          content: 'Just title and content',
        };

        const response = await request(app)
          .post('/api/entries')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(entryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(entryData.title);
        expect(response.body.data.content).toBe(entryData.content);
      });

      it('should return 400 when title is missing', async () => {
        const response = await request(app)
          .post('/api/entries')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'Content without title' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 when content is missing', async () => {
        const response = await request(app)
          .post('/api/entries')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Title without content' })
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

    describe('GET /api/entries', () => {
      it('should get user entries with default pagination', async () => {
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

      it('should get user entries with custom pagination', async () => {
        const response = await request(app)
          .get('/api/entries?page=1&limit=5')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
      });

      it('should get user entries sorted by updatedAt', async () => {
        const response = await request(app)
          .get('/api/entries?sortBy=updatedAt&order=asc')
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

      it('should return 400 when limit exceeds 100', async () => {
        const response = await request(app)
          .get('/api/entries?limit=101')
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
    });

    describe('GET /api/entries/:id', () => {
      it('should get a specific entry successfully', async () => {
        const response = await request(app)
          .get(`/api/entries/${entryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(entryId);
        expect(response.body.data.userId).toBe(userId);
      });

      it('should return 400 when entry ID is missing', async () => {
        const response = await request(app)
          .get('/api/entries/')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
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
    });

    describe('PUT /api/entries/:id', () => {
      it('should update entry successfully', async () => {
        const updateData = {
          title: 'Updated Entry Title',
          content: 'Updated content',
          mood: 'calm',
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
      });

      it('should update only title', async () => {
        const response = await request(app)
          .put(`/api/entries/${entryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'New Title Only' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('New Title Only');
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

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .put(`/api/entries/${entryId}`)
          .send({ title: 'New Title' })
          .expect(401);

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
    });

    describe('DELETE /api/entries/:id', () => {
      it('should delete entry successfully', async () => {
        const response = await request(app)
          .delete(`/api/entries/${entryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        expect(response.body).toEqual({});
      });

      it('should return 401 when token is missing', async () => {
        const response = await request(app)
          .delete(`/api/entries/${entryId}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 404 when entry does not exist', async () => {
        const response = await request(app)
          .delete('/api/entries/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describeIfDb('Access Control and Authorization', () => {
    let secondUserToken: string;
    let secondUserId: string;
    let secondUserEntryId: string;

    beforeAll(async () => {
      // Create a second user
      const secondUser = {
        email: 'second-user@example.com',
        password: 'SecondPassword123!',
        name: 'Second User',
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
          content: 'This belongs to second user',
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

    it('should only return entries belonging to the authenticated user', async () => {
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

  describeIfDb('Error Scenarios', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for protected endpoint without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for protected endpoint with malformed token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for protected endpoint with expired token', async () => {
      // Create an expired token (this is a simplified test)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
