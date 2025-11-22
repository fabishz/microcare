import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-End Tests for User Profile Operations
 * 
 * These tests verify the complete user profile workflows:
 * - Get user profile
 * - Update profile (name and email)
 * - Change password
 * - Authorization (cannot update other user's profile)
 * 
 * Requirements: 7.3, 7.4
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running
 * 2. Run: npm test -- e2e-profile.test.ts
 */

describe('E2E Tests - User Profile Operations', () => {
  let dbConnected = false;
  let accessToken: string;
  let userId: string;

  const testUser = {
    email: 'e2e-profile-test@example.com',
    password: 'E2EProfilePassword123!',
    name: 'E2E Profile Test User',
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
        '\n⚠️  Database not available for E2E profile tests.\n' +
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
          where: { user: { email: 'e2e-profile-second-user@example.com' } },
        });
        await prisma.user.deleteMany({
          where: { email: 'e2e-profile-second-user@example.com' },
        });
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    }
    await prisma.$disconnect();
  });

  const describeIfDb = dbConnected ? describe : describe.skip;

  describeIfDb('Get User Profile', () => {
    it('should retrieve user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
    });

    it('should not include password hash in profile response', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).not.toHaveProperty('password');
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

    it('should return 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'InvalidTokenFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Update User Profile', () => {
    it('should update user name successfully', async () => {
      const updateData = {
        name: 'Updated Profile Name',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should update user email successfully', async () => {
      const newEmail = 'e2e-profile-updated@example.com';
      const updateData = {
        email: newEmail,
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newEmail);
      expect(response.body.data.id).toBe(userId);

      // Verify email change persisted
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(newEmail);
    });

    it('should update both name and email simultaneously', async () => {
      const updateData = {
        name: 'Fully Updated Name',
        email: 'e2e-profile-full-update@example.com',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should return 400 when name is empty string', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when name is only whitespace', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'invalid-email-format' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when email is missing @ symbol', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'invalidemail.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when email is missing domain extension', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'invalid@email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
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

    it('should return 400 when email is already in use by another user', async () => {
      // Create a second user
      const secondUser = {
        email: 'e2e-profile-second-user@example.com',
        password: 'SecondUserPassword123!',
        name: 'Second User',
      };

      await request(app)
        .post('/api/auth/register')
        .send(secondUser);

      // Try to update first user's email to second user's email
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: secondUser.email })
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

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Change Password', () => {
    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: testUser.password,
        newPassword: 'NewPassword123!',
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data).not.toHaveProperty('passwordHash');

      // Verify new password works for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: changePasswordData.newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('accessToken');

      // Update testUser password for subsequent tests
      testUser.password = changePasswordData.newPassword;
    });

    it('should return 400 when current password is missing', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newPassword: 'AnotherPassword123!' })
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
          newPassword: 'AnotherPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when new password is same as current password', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: testUser.password,
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
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describeIfDb('Authorization - Cannot Update Other User\'s Profile', () => {
    let secondUserToken: string;
    let secondUserId: string;

    beforeAll(async () => {
      // Create a second user
      const secondUser = {
        email: 'e2e-profile-auth-test@example.com',
        password: 'SecondUserPassword123!',
        name: 'Second User for Auth Test',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(secondUser);

      secondUserToken = registerResponse.body.data.accessToken;
      secondUserId = registerResponse.body.data.user.id;
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

    it('should not allow user to update another user\'s profile via direct API call', async () => {
      // This test verifies that even if someone tries to manipulate the API,
      // they cannot update another user's profile
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ name: 'Hacked Name' })
        .expect(200);

      // Should update second user's profile, not first user's
      expect(response.body.data.id).toBe(secondUserId);
      expect(response.body.data.name).toBe('Hacked Name');

      // Verify first user's profile is unchanged
      const firstUserProfile = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(firstUserProfile.body.data.id).toBe(userId);
      expect(firstUserProfile.body.data.name).not.toBe('Hacked Name');
    });

    it('should not allow user to change another user\'s password', async () => {
      // This test verifies that users cannot change other users' passwords
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'HackedPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Verify first user can still login with original password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describeIfDb('Complete Profile Management Workflow', () => {
    it('should complete full profile workflow: get → update name → update email → change password', async () => {
      // Step 1: Get initial profile
      const initialProfile = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(initialProfile.body.success).toBe(true);
      expect(initialProfile.body.data.id).toBe(userId);

      // Step 2: Update name
      const updateNameResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Workflow Test Name' })
        .expect(200);

      expect(updateNameResponse.body.data.name).toBe('Workflow Test Name');

      // Step 3: Update email
      const newEmail = 'e2e-profile-workflow@example.com';
      const updateEmailResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newEmail })
        .expect(200);

      expect(updateEmailResponse.body.data.email).toBe(newEmail);

      // Step 4: Verify updates persisted
      const verifyProfile = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(verifyProfile.body.data.name).toBe('Workflow Test Name');
      expect(verifyProfile.body.data.email).toBe(newEmail);

      // Step 5: Change password
      const newPassword = 'WorkflowPassword123!';
      const changePasswordResponse = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword,
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // Step 6: Verify new password works for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: newEmail,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(newEmail);
    });
  });
});
