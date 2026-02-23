import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, ApiError } from '../lib/apiClient';

export enum UserRole {
  USER = 'USER',
  MEDICAL_PROFESSIONAL = 'MEDICAL_PROFESSIONAL',
  ADMIN = 'ADMIN',
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hasCompletedOnboarding: boolean;
  aiConsent: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored JWT on mount
    const token = localStorage.getItem('jwt');
    if (token) {
      // Validate token and fetch user profile
      apiClient.setToken(token);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await apiClient.get<User>('/api/v1/users/profile');
      setUser(userData);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      // Clear token on 401 (handled by apiClient redirect)
      if (apiError.statusCode === 401) {
        localStorage.removeItem('jwt');
        setUser(null);
      } else {
        console.error('Failed to fetch user profile:', apiError.message);
        setError('Failed to load user profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>(
        '/api/v1/auth/login',
        { email, password },
        { skipAuth: true }
      );

      // Store both access and refresh tokens securely
      apiClient.setToken(response.accessToken, response.refreshToken);
      setUser(response.user);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>(
        '/api/v1/auth/register',
        { name, email, password },
        { skipAuth: true }
      );

      // Store both access and refresh tokens securely
      apiClient.setToken(response.accessToken, response.refreshToken);
      setUser(response.user);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
