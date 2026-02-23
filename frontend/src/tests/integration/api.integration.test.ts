/**
 * Frontend-Backend API Integration Tests
 * 
 * Tests complete frontend integration with backend APIs
 * Covers authentication, entries, and profile management flows
 * 
 * Prerequisites:
 * - Backend running on http://localhost:3000
 * - PostgreSQL database running
 * - All migrations applied
 * 
 * To run: npm run test -- api.integration.test.ts
 */

import { apiClient, ApiError } from '../../lib/apiClient';

interface TestUser {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface JournalEntryResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedEntriesResponse {
  data: JournalEntryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

describe('Frontend-Backend API Integration Tests', () => {
  let authToken: string;
  let refreshToken: string;
  let userId: string;
  let createdEntryId: string;

  const testUser: TestUser = {
    email: `integration-test-${Date.now()}@example.com`,
    password: 'IntegrationTest123!',
    name: 'Integration Test User',
  };

  describe('Authentication - Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await apiClient.post<AuthResponse>(
        '/api/v1/auth/register',
        {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
        { skipAuth: true }
      );

      expect(response).toBeDefined();
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.user.email).toBe(testUser.email);
      expect(response.user.name).toBe(testUser.name);

      authToken = response.accessToken;
      refreshToken = response.refreshToken;
      userId = response.user.id;
      apiClient.setToken(authToken, refreshToken);
    });

    it('should reject registration with duplicate email', async () => {
      try {
        await apiClient.post<AuthResponse>(
          '/api/v1/auth/register',
          {
            email: testUser.email,
            password: 'AnotherPassword123!',
            name: 'Another User',
          },
          { skipAuth: true }
        );
        fail('Should have thrown an error for duplicate email');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(400);
        expect(apiError.message).toContain('already');
      }
    });

    it('should reject registration with invalid email', async () => {
      try {
        await apiClient.post<AuthResponse>(
          '/api/v1/auth/register',
          {
            email: 'invalid-email',
            password: 'InvalidPassword123!',
            name: 'Invalid User',
          },
          { skipAuth: true }
        );
        fail('Should have thrown an error for invalid email');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(400);
        expect(apiError.details?.email).toBeDefined();
      }
    });
  });

  describe('Authentication - Login', () => {
    it('should login with valid credentials', async () => {
      const response = await apiClient.post<AuthResponse>(
        '/api/v1/auth/login',
        {
          email: testUser.email,
          password: testUser.password,
        },
        { skipAuth: true }
      );

      expect(response).toBeDefined();
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.user.email).toBe(testUser.email);
    });

    it('should reject login with invalid email', async () => {
      try {
        await apiClient.post<AuthResponse>(
          '/api/v1/auth/login',
          {
            email: 'nonexistent@example.com',
            password: testUser.password,
          },
          { skipAuth: true }
        );
        fail('Should have thrown an error for invalid email');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(401);
      }
    });

    it('should reject login with incorrect password', async () => {
      try {
        await apiClient.post<AuthResponse>(
          '/api/v1/auth/login',
          {
            email: testUser.email,
            password: 'WrongPassword123!',
          },
          { skipAuth: true }
        );
        fail('Should have thrown an error for incorrect password');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(401);
      }
    });
  });

  describe('Journal Entries Management', () => {
    beforeAll(() => {
      apiClient.setToken(authToken, refreshToken);
    });

    describe('Create Entries', () => {
      it('should create a new journal entry', async () => {
        const entryData = {
          title: 'My First Integration Test Entry',
          content: 'This is a test entry created during integration testing.',
          mood: 'happy',
          tags: ['test', 'integration'],
        };

        const response = await apiClient.post<JournalEntryResponse>(
          '/api/v1/entries',
          entryData
        );

        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.title).toBe(entryData.title);
        expect(response.content).toBe(entryData.content);
        expect(response.mood).toBe(entryData.mood);
        expect(response.userId).toBe(userId);

        createdEntryId = response.id;
      });

      it('should reject entry creation without title', async () => {
        try {
          await apiClient.post<JournalEntryResponse>('/api/v1/entries', {
            content: 'This entry has no title',
          });
          fail('Should have thrown an error for missing title');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(400);
          expect(apiError.details?.title).toBeDefined();
        }
      });

      it('should reject entry creation without content', async () => {
        try {
          await apiClient.post<JournalEntryResponse>('/api/v1/entries', {
            title: 'Entry without content',
          });
          fail('Should have thrown an error for missing content');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(400);
          expect(apiError.details?.content).toBeDefined();
        }
      });
    });

    describe('Fetch Entries', () => {
      it('should fetch all entries with pagination', async () => {
        const response = await apiClient.get<PaginatedEntriesResponse>(
          '/api/v1/entries',
          {
            params: { page: 1, limit: 10 },
          }
        );

        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.page).toBe(1);
        expect(response.limit).toBe(10);
        expect(response.total).toBeGreaterThanOrEqual(1);
      });

      it('should fetch specific entry by id', async () => {
        const response = await apiClient.get<JournalEntryResponse>(
          `/api/v1/entries/${createdEntryId}`
        );

        expect(response).toBeDefined();
        expect(response.id).toBe(createdEntryId);
        expect(response.userId).toBe(userId);
      });

      it('should handle pagination parameters', async () => {
        const response = await apiClient.get<PaginatedEntriesResponse>(
          '/api/v1/entries',
          {
            params: { page: 1, limit: 5 },
          }
        );

        expect(response.limit).toBe(5);
        expect(response.data.length).toBeLessThanOrEqual(5);
      });

      it('should return 404 for non-existent entry', async () => {
        try {
          await apiClient.get<JournalEntryResponse>(
            '/api/v1/entries/nonexistent-id'
          );
          fail('Should have thrown a 404 error');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(404);
        }
      });
    });

    describe('Update Entries', () => {
      it('should update an existing entry', async () => {
        const updatedData = {
          title: 'Updated Entry Title',
          content: 'Updated entry content with more details',
          mood: 'thoughtful',
        };

        const response = await apiClient.put<JournalEntryResponse>(
          `/api/v1/entries/${createdEntryId}`,
          updatedData
        );

        expect(response).toBeDefined();
        expect(response.id).toBe(createdEntryId);
        expect(response.title).toBe(updatedData.title);
        expect(response.content).toBe(updatedData.content);
        expect(response.mood).toBe(updatedData.mood);
      });

      it('should return 404 when updating non-existent entry', async () => {
        try {
          await apiClient.put<JournalEntryResponse>(
            '/api/v1/entries/nonexistent-id',
            { title: 'Updated' }
          );
          fail('Should have thrown a 404 error');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(404);
        }
      });
    });

    describe('Delete Entries', () => {
      it('should delete an entry', async () => {
        const entryToDelete = await apiClient.post<JournalEntryResponse>(
          '/api/v1/entries',
          {
            title: 'Entry to be deleted',
            content: 'This will be deleted',
          }
        );

        await apiClient.delete<void>(
          `/api/v1/entries/${entryToDelete.id}`
        );

        try {
          await apiClient.get<JournalEntryResponse>(
            `/api/v1/entries/${entryToDelete.id}`
          );
          fail('Should have thrown a 404 error for deleted entry');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(404);
        }
      });

      it('should return 404 when deleting non-existent entry', async () => {
        try {
          await apiClient.delete<void>('/api/v1/entries/nonexistent-id');
          fail('Should have thrown a 404 error');
        } catch (error: unknown) {
          const apiError = error as ApiError;
          expect(apiError.statusCode).toBe(404);
        }
      });
    });
  });

  describe('User Profile Management', () => {
    beforeAll(() => {
      apiClient.setToken(authToken, refreshToken);
    });

    it('should fetch user profile', async () => {
      const profile = await apiClient.get<UserProfile>('/api/v1/users/profile');

      expect(profile).toBeDefined();
      expect(profile.id).toBe(userId);
      expect(profile.email).toBe(testUser.email);
      expect(profile.name).toBe(testUser.name);
    });

    it('should update user profile', async () => {
      const updatedName = 'Updated Test User';
      const response = await apiClient.put<UserProfile>('/api/v1/users/profile', {
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.name).toBe(updatedName);

      const profile = await apiClient.get<UserProfile>('/api/v1/users/profile');
      expect(profile.name).toBe(updatedName);
    });

    it('should reject profile update with invalid email', async () => {
      try {
        await apiClient.put<UserProfile>('/api/v1/users/profile', {
          email: 'invalid-email',
        });
        fail('Should have thrown an error for invalid email');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(400);
      }
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject requests without token', async () => {
      const tempToken = authToken;
      const tempRefresh = refreshToken;

      apiClient.setToken('', '');

      try {
        await apiClient.get('/api/v1/users/profile');
        fail('Should have thrown an 401 error');
      } catch (error: unknown) {
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(401);
      }

      apiClient.setToken(tempToken, tempRefresh);
    });

    it('should allow unauthenticated access to registration', async () => {
      const response = await apiClient.post<AuthResponse>(
        '/api/v1/auth/register',
        {
          email: `public-access-${Date.now()}@example.com`,
          password: 'PublicAccess123!',
          name: 'Public Access User',
        },
        { skipAuth: true }
      );

      expect(response).toBeDefined();
      expect(response.accessToken).toBeDefined();
    });

    it('should allow unauthenticated access to login', async () => {
      const testEmail = `login-test-${Date.now()}@example.com`;

      await apiClient.post<AuthResponse>(
        '/api/v1/auth/register',
        {
          email: testEmail,
          password: 'LoginTest123!',
          name: 'Login Test User',
        },
        { skipAuth: true }
      );

      const response = await apiClient.post<AuthResponse>(
        '/api/v1/auth/login',
        {
          email: testEmail,
          password: 'LoginTest123!',
        },
        { skipAuth: true }
      );

      expect(response).toBeDefined();
      expect(response.accessToken).toBeDefined();
    });
  });

  afterAll(async () => {
    console.log('Integration tests completed');
  });
});
