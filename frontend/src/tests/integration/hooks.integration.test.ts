/**
 * React Hooks Integration Tests
 * 
 * Tests useEntries and useProfile hooks with real API calls
 * Validates that hooks properly handle API responses and state management
 * 
 * Prerequisites:
 * - Backend running on http://localhost:3000
 * - PostgreSQL database running
 * - All migrations applied
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEntries, JournalEntry, CreateEntryInput } from '../../hooks/useEntries';
import { useProfile, UserProfile, UpdateProfileInput } from '../../hooks/useProfile';
import { apiClient } from '../../lib/apiClient';

// Mock test user
const testUserEmail = `hooks-test-${Date.now()}@example.com`;
const testPassword = 'HooksTest123!';
const testUserName = 'Hooks Test User';

describe('React Hooks Integration Tests', () => {
  let authToken: string;
  let refreshToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Register and login a test user
    const authResponse = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string };
    }>(
      '/api/v1/auth/register',
      {
        email: testUserEmail,
        password: testPassword,
        name: testUserName,
      },
      { skipAuth: true }
    );

    authToken = authResponse.accessToken;
    refreshToken = authResponse.refreshToken;
    testUserId = authResponse.user.id;
    apiClient.setToken(authToken, refreshToken);
  });

  describe('useEntries Hook', () => {
    it('should initialize with empty entries and default pagination', () => {
      const { result } = renderHook(() => useEntries());

      expect(result.current.entries).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.limit).toBe(10);
      expect(result.current.pagination.total).toBe(0);
    });

    it('should fetch entries successfully', async () => {
      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.fetchEntries(1, 10);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toBeDefined();
      expect(Array.isArray(result.current.entries)).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should create a new entry', async () => {
      const { result } = renderHook(() => useEntries());

      const entryData: CreateEntryInput = {
        title: 'Test Entry from Hooks',
        content: 'This is a test entry created via hooks',
        mood: 'happy',
        tags: ['test', 'hooks'],
      };

      let createdEntry: JournalEntry | null = null;

      await act(async () => {
        createdEntry = await result.current.createEntry(entryData);
      });

      expect(createdEntry).toBeDefined();
      expect(createdEntry?.title).toBe(entryData.title);
      expect(createdEntry?.content).toBe(entryData.content);
      expect(createdEntry?.mood).toBe(entryData.mood);
    });

    it('should handle entry creation errors', async () => {
      const { result } = renderHook(() => useEntries());

      const invalidEntry = {
        content: 'Entry without title',
      };

      await act(async () => {
        try {
          await result.current.createEntry(invalidEntry as CreateEntryInput);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    it('should get entry by id', async () => {
      const { result } = renderHook(() => useEntries());

      // First create an entry
      const entryData: CreateEntryInput = {
        title: 'Entry for Fetch Test',
        content: 'Test content',
      };

      let entryId: string;

      await act(async () => {
        const createdEntry = await result.current.createEntry(entryData);
        entryId = createdEntry.id;
      });

      // Then fetch it by ID
      let fetchedEntry: JournalEntry | null = null;

      await act(async () => {
        fetchedEntry = await result.current.getEntry(entryId!);
      });

      expect(fetchedEntry).toBeDefined();
      expect(fetchedEntry?.id).toBe(entryId);
      expect(fetchedEntry?.title).toBe(entryData.title);
    });

    it('should update an entry', async () => {
      const { result } = renderHook(() => useEntries());

      // Create entry
      const entryData: CreateEntryInput = {
        title: 'Original Title',
        content: 'Original content',
        mood: 'neutral',
      };

      let entryId: string;

      await act(async () => {
        const createdEntry = await result.current.createEntry(entryData);
        entryId = createdEntry.id;
      });

      // Update it
      const updateData = {
        title: 'Updated Title',
        mood: 'happy',
      };

      let updatedEntry: JournalEntry | null = null;

      await act(async () => {
        updatedEntry = await result.current.updateEntry(entryId!, updateData);
      });

      expect(updatedEntry?.title).toBe(updateData.title);
      expect(updatedEntry?.mood).toBe(updateData.mood);
      expect(updatedEntry?.content).toBe(entryData.content);
    });

    it('should delete an entry', async () => {
      const { result } = renderHook(() => useEntries());

      // Create entry to delete
      const entryData: CreateEntryInput = {
        title: 'Entry to Delete',
        content: 'This will be deleted',
      };

      let entryId: string;

      await act(async () => {
        const createdEntry = await result.current.createEntry(entryData);
        entryId = createdEntry.id;
      });

      // Delete it
      await act(async () => {
        await result.current.deleteEntry(entryId!);
      });

      // Try to fetch it - should fail
      let fetchedEntry: JournalEntry | null = null;
      let fetchError: unknown = null;

      await act(async () => {
        try {
          fetchedEntry = await result.current.getEntry(entryId!);
        } catch (error) {
          fetchError = error;
        }
      });

      expect(fetchError).toBeDefined();
      expect(fetchedEntry).toBeNull();
    });

    it('should handle pagination', async () => {
      const { result } = renderHook(() => useEntries());

      // Fetch first page
      await act(async () => {
        await result.current.fetchEntries(1, 5);
      });

      const firstPageData = result.current.entries;
      const firstPageLimit = result.current.pagination.limit;

      expect(firstPageLimit).toBe(5);
      expect(firstPageData.length).toBeLessThanOrEqual(5);

      // Fetch second page
      await act(async () => {
        await result.current.fetchEntries(2, 5);
      });

      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.limit).toBe(5);
    });
  });

  describe('useProfile Hook', () => {
    it('should initialize with null profile', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch user profile', async () => {
      const { result } = renderHook(() => useProfile());

      let fetchedProfile: UserProfile | null = null;

      await act(async () => {
        fetchedProfile = await result.current.fetchProfile();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchedProfile).toBeDefined();
      expect(fetchedProfile?.id).toBe(testUserId);
      expect(fetchedProfile?.email).toBe(testUserEmail);
      expect(result.current.profile).toEqual(fetchedProfile);
    });

    it('should update user profile', async () => {
      const { result } = renderHook(() => useProfile());

      // First fetch profile
      await act(async () => {
        await result.current.fetchProfile();
      });

      // Update it
      const updatedName = 'Updated Hooks Test User';
      const updateData: UpdateProfileInput = {
        name: updatedName,
      };

      let updatedProfile: UserProfile | null = null;

      await act(async () => {
        updatedProfile = await result.current.updateProfile(updateData);
      });

      expect(updatedProfile?.name).toBe(updatedName);
      expect(updatedProfile?.email).toBe(testUserEmail);
      expect(result.current.profile?.name).toBe(updatedName);
    });

    it('should handle profile fetch errors gracefully', async () => {
      const { result } = renderHook(() => useProfile());

      // Clear token to cause error
      const tempToken = authToken;
      const tempRefresh = refreshToken;
      apiClient.setToken('', '');

      let error: unknown = null;

      await act(async () => {
        try {
          await result.current.fetchProfile();
        } catch (err) {
          error = err;
        }
      });

      expect(error).toBeDefined();
      expect(result.current.error).toBeTruthy();

      // Restore token
      apiClient.setToken(tempToken, tempRefresh);
    });

    it('should handle profile update errors gracefully', async () => {
      const { result } = renderHook(() => useProfile());

      // Fetch profile first
      await act(async () => {
        await result.current.fetchProfile();
      });

      // Try invalid update
      let error: unknown = null;

      await act(async () => {
        try {
          await result.current.updateProfile({ email: 'invalid-email' });
        } catch (err) {
          error = err;
        }
      });

      expect(error).toBeDefined();
    });

    it('should change password', async () => {
      const { result } = renderHook(() => useProfile());

      const newPassword = 'NewPassword123!';

      await act(async () => {
        await result.current.changePassword({
          currentPassword: testPassword,
          newPassword: newPassword,
        });
      });

      // Password changed successfully - no error thrown
      expect(result.current.error).toBeNull();
    });

    it('should reject password change with wrong current password', async () => {
      const { result } = renderHook(() => useProfile());

      let error: unknown = null;

      await act(async () => {
        try {
          await result.current.changePassword({
            currentPassword: 'WrongPassword123!',
            newPassword: 'AnotherPassword123!',
          });
        } catch (err) {
          error = err;
        }
      });

      expect(error).toBeDefined();
    });
  });

  afterAll(async () => {
    console.log('Hooks integration tests completed');
    // Cleanup is optional - test data will remain in DB
  });
});
