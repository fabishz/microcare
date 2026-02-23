import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  aiConsent: boolean;
  role?: string;
  hasCompletedOnboarding?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  aiConsent?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface UseProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile() {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  /**
   * Fetch user profile
   */
  const fetchProfile = useCallback(async (): Promise<UserProfile> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const profile = await apiClient.get<UserProfile>('/api/v1/users/profile');
      setState((prev) => ({
        ...prev,
        profile,
        isLoading: false,
      }));
      return profile;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to fetch profile';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<UserProfile> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updatedProfile = await apiClient.put<UserProfile>(
          '/api/v1/users/profile',
          input
        );
        setState((prev) => ({
          ...prev,
          profile: updatedProfile,
          isLoading: false,
        }));
        return updatedProfile;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Failed to update profile';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Change user password
   */
  const changePassword = useCallback(
    async (input: ChangePasswordInput): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await apiClient.post('/api/v1/users/change-password', input);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Failed to change password';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Export user entries in a given format
   */
  const exportEntries = useCallback(async (format: 'pdf' | 'json' | 'txt'): Promise<void> => {
    const token = localStorage.getItem('jwt');
    const response = await fetch(`${baseUrl}/api/v1/users/entries/export?format=${format}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const apiError = await response.json().catch(() => null);
      throw new Error(apiError?.error?.message || 'Failed to export entries');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') 
      || `microcare-entries.${format}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (password: string): Promise<void> => {
    const token = localStorage.getItem('jwt');
    const response = await fetch(`${baseUrl}/api/v1/users/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const apiError = await response.json().catch(() => null);
      throw new Error(apiError?.error?.message || 'Failed to delete account');
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    fetchProfile,
    updateProfile,
    changePassword,
    exportEntries,
    deleteAccount,
    clearError,
  };
}
