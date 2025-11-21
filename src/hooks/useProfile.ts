import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
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
      const profile = await apiClient.get<UserProfile>('/api/users/profile');
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
          '/api/users/profile',
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
        await apiClient.post('/api/users/change-password', input);
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
    clearError,
  };
}
