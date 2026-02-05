import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../lib/apiClient';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEntries {
  data: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEntryInput {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}

interface UseEntriesState {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useEntries() {
  const [state, setState] = useState<UseEntriesState>({
    entries: [],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });

  /**
   * Fetch entries with pagination
   */
  const fetchEntries = useCallback(
    async (page: number = 1, limit: number = 10) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await apiClient.get<PaginatedEntries>('/api/entries', {
          params: { page, limit },
        });

        setState((prev) => ({
          ...prev,
          entries: response.data,
          pagination: {
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
          },
          isLoading: false,
        }));
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Failed to fetch entries';
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
   * Get a specific entry by ID
   */
  const getEntry = useCallback(async (id: string): Promise<JournalEntry> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const entry = await apiClient.get<JournalEntry>(`/api/entries/${id}`);
      setState((prev) => ({ ...prev, isLoading: false }));
      return entry;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to fetch entry';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  /**
   * Create a new journal entry
   */
  const createEntry = useCallback(
    async (input: CreateEntryInput): Promise<JournalEntry> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const newEntry = await apiClient.post<JournalEntry>('/api/entries', input);
        setState((prev) => ({
          ...prev,
          entries: [newEntry, ...prev.entries],
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total + 1,
          },
          isLoading: false,
        }));
        return newEntry;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Failed to create entry';
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
   * Update an existing journal entry
   */
  const updateEntry = useCallback(
    async (id: string, input: UpdateEntryInput): Promise<JournalEntry> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updatedEntry = await apiClient.put<JournalEntry>(
          `/api/entries/${id}`,
          input
        );
        setState((prev) => ({
          ...prev,
          entries: prev.entries.map((entry) =>
            entry.id === id ? updatedEntry : entry
          ),
          isLoading: false,
        }));
        return updatedEntry;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Failed to update entry';
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
   * Delete a journal entry
   */
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiClient.delete(`/api/entries/${id}`);
      setState((prev) => ({
        ...prev,
        entries: prev.entries.filter((entry) => entry.id !== id),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
        isLoading: false,
      }));
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to delete entry';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    entries: state.entries,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    fetchEntries,
    getEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    clearError,
  };
}
