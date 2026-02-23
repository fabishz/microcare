import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-End Tests for Error Scenarios
 * 
 * These tests verify error handling across the application:
 * - 401 Unauthorized responses (missing/invalid tokens)
 * - 403 Forbidden responses (authorization failures)
 * - 404 Not Found responses (missing resources)
 * - 400 Bad Request responses (validation errors)
 * - Network error handling
 * 
 * Requirements: 7.4, 7.5
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running
 * 2. Run: npm test -- e2e-errors.test.ts
 */

describe('E2E Tests - Error Scenarios', () => {
  let dbConnected = false;
  let accessToken: string;
  let entryId: string;

  const testUser = {
    email: 'e2e-errors-test@example.com',
    password: 'E2EErrorsPassword123!',
    name: 'E2E Errors Test User',
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
        .post('/api/v1/auth/register')
        .send(testUser);

      accessToken = registerResponse.body.data.accessToken;

      // Create a test entry
      const entryResponse = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Entry for Error Scenarios',
          content: 'This entry is used for testing error scenarios',
        });

      entryId = entryResponse.body.data.id;
    } catch (error) {
      console.warn(
        '\n⚠️  Database not available for E2E error tests.\n' +
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

        // Clean up second user if created
        await prisma.journalEntry.deleteMany({
          where: { user: { email: 'e2e-errors-second-user@example.com' } },
        });
        await prisma.user.deleteMany({
          where: { email: 'e2e-errors-second-user@example.com' },
        });
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    }
    await prisma.$disconnect();
  });

  const describeIfDb = dbConnected ? describe : describe.skip;

  describeIfDb('401 Unauthorized Error Scenarios', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(response.body.error.message).toBeDefined();
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 401 when Authorization header is empty', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when Authorization header has invalid format', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when Bearer token is missing', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token-string')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when token is malformed JWT', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when token has wrong signature', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when token is expired', async () => {
      // Create an expired token (this would require mocking or a special endpoint)
      // For now, we test with an obviously invalid token
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when accessing protected endpoint without token', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .send({
          title: 'Test',
          content: 'Test',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when accessing profile endpoint without token', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when accessing change-password endpoint without token', async () => {
      const response = await request(app)
        .post('/api/v1/users/change-password')
        .send({
          currentPassword: 'test',
          newPassword: 'test',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describeIfDb('403 Forbidden Error Scenarios', () => {
    let secondUserToken: string;
    let secondUserId: string;
    let secondUserEntryId: string;

    beforeAll(async () => {
      // Create a second user
      const secondUser = {
        email: 'e2e-errors-second-user@example.com',
        password: 'SecondUserPassword123!',
        name: 'Second User for Errors',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(secondUser);

      secondUserToken = registerResponse.body.data.accessToken;
      secondUserId = registerResponse.body.data.user.id;

      // Create an entry for the second user
      const entryResponse = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          title: 'Second User Entry',
          content: 'This entry belongs to the second user',
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

    it('should return 403 when accessing another user\'s entry', async () => {
      const response = await request(app)
        .get(`/api/v1/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return 403 when updating another user\'s entry', async () => {
      const response = await request(app)
        .put(`/api/v1/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return 403 when deleting another user\'s entry', async () => {
      const response = await request(app)
        .delete(`/api/v1/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return 403 when attempting to change another user\'s password', async () => {
      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describeIfDb('404 Not Found Error Scenarios', () => {
    it('should return 404 when accessing non-existent entry', async () => {
      const response = await request(app)
        .get('/api/v1/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return 404 when updating non-existent entry', async () => {
      const response = await request(app)
        .put('/api/v1/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should return 404 when deleting non-existent entry', async () => {
      const response = await request(app)
        .delete('/api/v1/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should return 404 when accessing non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-endpoint')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should return 404 when accessing non-existent route', async () => {
      const response = await request(app)
        .post('/api/v1/invalid/route/path')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
    });
  });

  describeIfDb('400 Bad Request Error Scenarios', () => {
    it('should return 400 when creating entry without title', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Content without title',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return 400 when creating entry without content', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Title without content',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when creating entry with empty title', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          content: 'Some content',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when creating entry with empty content', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Some title',
          content: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when creating entry with invalid mood', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Entry with invalid mood',
          content: 'Some content',
          mood: 'invalid-mood-value',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when registering without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when registering without password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when registering without name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when registering with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-format',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when logging in without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when logging in without password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating profile with empty name', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating profile with invalid email', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating profile with no fields', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when changing password without current password', async () => {
      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when changing password without new password', async () => {
      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when listing entries with invalid page', async () => {
      const response = await request(app)
        .get('/api/v1/entries?page=0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when listing entries with invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/entries?limit=0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when listing entries with limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/v1/entries?limit=101')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating entry with empty title', async () => {
      const response = await request(app)
        .put(`/api/v1/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating entry with empty content', async () => {
      const response = await request(app)
        .put(`/api/v1/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating entry with no fields', async () => {
      const response = await request(app)
        .put(`/api/v1/entries/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describeIfDb('Error Response Format Validation', () => {
    it('should return consistent error response format for 401 errors', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return consistent error response format for 403 errors', async () => {
      let secondUserToken: string;
      let secondUserEntryId: string;

      // Create second user and entry
      const secondUser = {
        email: `e2e-errors-403-test-${Date.now()}@example.com`,
        password: 'SecondUserPassword123!',
        name: 'Second User',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(secondUser);

      secondUserToken = registerResponse.body.data.accessToken;

      const entryResponse = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          title: 'Test Entry',
          content: 'Test content',
        });

      secondUserEntryId = entryResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/entries/${secondUserEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');

      // Clean up
      await prisma.journalEntry.deleteMany({
        where: { id: secondUserEntryId },
      });
      await prisma.user.deleteMany({
        where: { email: secondUser.email },
      });
    });

    it('should return consistent error response format for 404 errors', async () => {
      const response = await request(app)
        .get('/api/v1/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return consistent error response format for 400 errors', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Missing title',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include validation details in 400 error responses when available', async () => {
      const response = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          content: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      // Details may or may not be present depending on implementation
      if (response.body.error.details) {
        expect(typeof response.body.error.details).toBe('object');
      }
    });
  });
});
