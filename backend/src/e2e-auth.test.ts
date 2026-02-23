import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-End Tests for User Registration and Login
 * 
 * These tests verify the complete authentication workflows:
 * - User registration flow
 * - User login flow with valid and invalid credentials
 * - Token persistence and refresh
 * - Logout functionality
 * - Access to protected endpoints after authentication
 * 
 * Requirements: 7.1, 7.4
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running
 * 2. Run: npm test -- e2e-auth.test.ts
 */

describe('E2E Tests - User Registration and Login', () => {
  let dbConnected = false;

  const testUser = {
    email: 'e2e-auth-test@example.com',
    password: 'E2ETestPassword123!',
    name: 'E2E Auth Test User',
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
    } catch (error) {
      console.warn(
        '\n⚠️  Database not available for E2E tests.\n' +
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

  describeIfDb('Complete Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
    });

    it('should return 409 when attempting to register with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when required fields are missing during registration', async () => {
      const invalidUsers = [
        { password: testUser.password, name: testUser.name }, // missing email
        { email: testUser.email, name: testUser.name }, // missing password
        { email: testUser.email, password: testUser.password }, // missing name
      ];

      for (const invalidUser of invalidUsers) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(invalidUser)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-format',
          password: testUser.password,
          name: testUser.name,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Complete Login Flow', () => {
    let registeredUser: any;

    beforeAll(async () => {
      // Register a user for login tests
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'LoginTestPassword123!',
          name: 'Login Test User',
        });

      registeredUser = registerResponse.body.data.user;
    });

    afterAll(async () => {
      // Clean up test user
      await prisma.journalEntry.deleteMany({
        where: { userId: registeredUser.id },
      });
      await prisma.user.deleteMany({
        where: { email: registeredUser.email },
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registeredUser.email,
          password: 'LoginTestPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.id).toBe(registeredUser.id);
      expect(response.body.data.user.email).toBe(registeredUser.email);
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registeredUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidLogins = [
        { password: 'SomePassword123!' }, // missing email
        { email: registeredUser.email }, // missing password
      ];

      for (const invalidLogin of invalidLogins) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(invalidLogin)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });
  });

  describeIfDb('Token Persistence and Refresh', () => {
    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Register and login a user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'token-test@example.com',
          password: 'TokenTestPassword123!',
          name: 'Token Test User',
        });

      userId = registerResponse.body.data.user.id;
      accessToken = registerResponse.body.data.accessToken;
      refreshToken = registerResponse.body.data.refreshToken;
    });

    afterAll(async () => {
      // Clean up test user
      await prisma.journalEntry.deleteMany({
        where: { userId },
      });
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    });

    it('should use access token to access protected endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when access token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should refresh access token using refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      // Verify new access token works
      const newAccessToken = response.body.data.accessToken;
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe(userId);
    });

    it('should return 401 when refresh token is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Logout Functionality', () => {
    let userId: string;
    let accessToken: string;

    beforeAll(async () => {
      // Register and login a user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout-test@example.com',
          password: 'LogoutTestPassword123!',
          name: 'Logout Test User',
        });

      userId = registerResponse.body.data.user.id;
      accessToken = registerResponse.body.data.accessToken;
    });

    afterAll(async () => {
      // Clean up test user
      await prisma.journalEntry.deleteMany({
        where: { userId },
      });
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    });

    it('should successfully logout with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should return 401 when logout is attempted without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when logout is attempted with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Complete User Journey - Register to Dashboard Access', () => {
    const journeyUser = {
      email: 'journey-test@example.com',
      password: 'JourneyTestPassword123!',
      name: 'Journey Test User',
    };

    let userId: string;

    afterAll(async () => {
      // Clean up test user
      if (userId) {
        await prisma.journalEntry.deleteMany({
          where: { userId },
        });
        await prisma.user.deleteMany({
          where: { id: userId },
        });
      }
    });

    it('should complete full user journey: register → login → access dashboard → logout', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(journeyUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const { accessToken, refreshToken, user } = registerResponse.body.data;
      userId = user.id;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(user.email).toBe(journeyUser.email);

      // Step 2: Access dashboard (get profile) with access token
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe(userId);
      expect(profileResponse.body.data.email).toBe(journeyUser.email);

      // Step 3: Create a journal entry (dashboard functionality)
      const entryResponse = await request(app)
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'My First Entry',
          content: 'This is my first journal entry',
          mood: 'happy',
        })
        .expect(201);

      expect(entryResponse.body.success).toBe(true);
      expect(entryResponse.body.data.userId).toBe(userId);

      // Step 4: Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Step 5: Verify access is denied after logout
      const deniedResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(deniedResponse.body.success).toBe(false);

      // Step 6: Login again with same credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: journeyUser.email,
          password: journeyUser.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.id).toBe(userId);

      // Step 7: Verify access is restored with new token
      const restoredResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(restoredResponse.body.success).toBe(true);
      expect(restoredResponse.body.data.id).toBe(userId);
    });
  });
});
