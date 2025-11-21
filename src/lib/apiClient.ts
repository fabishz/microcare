/**
 * Centralized API Client with Token Management
 * Handles automatic JWT token injection, error handling, and 401 responses
 * 
 * Security Features:
 * - Automatic token refresh on expiration
 * - Tokens never logged or exposed in console
 * - Secure token storage with expiration tracking
 * - Automatic 401 handling with token refresh retry
 */

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
}

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

class ApiClient {
  private baseUrl: string;
  private tokenKey = 'jwt';
  private refreshTokenKey = 'refreshToken';
  private tokenExpirationKey = 'tokenExpiration';
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Get the stored JWT token
   */
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get the stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Clear all stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tokenExpirationKey);
  }

  /**
   * Set the JWT token and refresh token
   */
  setToken(token: string, refreshToken?: string): void {
    localStorage.setItem(this.tokenKey, token);
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    // Store token expiration time for early refresh detection
    const expirationTime = this.getTokenExpiration(token);
    if (expirationTime) {
      localStorage.setItem(this.tokenExpirationKey, expirationTime.toString());
    }
  }

  /**
   * Decode JWT token to extract payload (without verification)
   * Used only for client-side expiration checking
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(atob(parts[1]));
      return decoded as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  private getTokenExpiration(token: string): number | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;
    return payload.exp * 1000; // Convert from seconds to milliseconds
  }

  /**
   * Check if token is expired or about to expire (within 1 minute)
   */
  private isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    const now = Date.now();
    const bufferTime = 60 * 1000; // 1 minute buffer

    return now >= expiration - bufferTime;
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          this.clearTokens();
          return null;
        }

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          this.clearTokens();
          return null;
        }

        const data = await response.json();
        const newAccessToken = data.data?.accessToken;
        const newRefreshToken = data.data?.refreshToken;

        if (newAccessToken) {
          this.setToken(newAccessToken, newRefreshToken);
          return newAccessToken;
        }

        this.clearTokens();
        return null;
      } catch {
        this.clearTokens();
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Build request headers with automatic token injection
   * Note: Token is never logged or exposed in console
   */
  private buildHeaders(config?: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    // Inject JWT token if not skipped
    if (!config?.skipAuth) {
      const token = this.getToken();
      if (token) {
        // Token is injected but never logged for security
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return `?${searchParams.toString()}`;
  }

  /**
   * Parse error response and format consistently
   * Ensures sensitive data (tokens, passwords) are never exposed in error messages
   */
  private parseError(response: Response, data: unknown): ApiError {
    // Try to extract error from response body
    if (typeof data === 'object' && data !== null) {
      const errorObj = data as Record<string, unknown>;
      
      if (errorObj.error && typeof errorObj.error === 'object') {
        const error = errorObj.error as Record<string, unknown>;
        return {
          message: (error.message as string) || 'An error occurred',
          statusCode: response.status,
          code: (error.code as string) || undefined,
          details: this.sanitizeErrorDetails(error.details as Record<string, unknown>) || undefined,
        };
      }

      if (errorObj.message) {
        return {
          message: errorObj.message as string,
          statusCode: response.status,
          code: (errorObj.code as string) || undefined,
          details: this.sanitizeErrorDetails(errorObj.details as Record<string, unknown>) || undefined,
        };
      }
    }

    // Fallback to status text or generic message
    return {
      message: response.statusText || 'An error occurred',
      statusCode: response.status,
    };
  }

  /**
   * Sanitize error details to prevent token/password exposure
   */
  private sanitizeErrorDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      // Remove sensitive fields from error details
      if (
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret')
      ) {
        continue;
      }
      sanitized[key] = value;
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Handle 401 Unauthorized responses
   */
  private handle401(): void {
    this.clearTokens();
    // Redirect to login page
    window.location.href = '/login';
  }

  /**
   * Make HTTP request with error handling and automatic token refresh
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    // Check if token needs refresh before making request
    const token = this.getToken();
    if (token && !config?.skipAuth && this.isTokenExpired(token)) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) {
        this.handle401();
        throw this.createError('Unauthorized. Please log in again.', 401);
      }
    }

    const fullUrl = `${this.baseUrl}${url}${this.buildQueryString(config?.params)}`;
    const headers = this.buildHeaders(config);

    const fetchConfig: RequestInit = {
      method,
      headers,
    };

    if (body) {
      fetchConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, fetchConfig);

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && !config?.skipAuth) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // Retry request with new token
          return this.request<T>(method, url, body, config);
        }
        this.handle401();
        throw this.createError('Unauthorized. Please log in again.', 401);
      }

      // Parse response body
      let responseData: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const error = this.parseError(response, responseData);
        throw error;
      }

      // Return data from response
      if (typeof responseData === 'object' && responseData !== null) {
        const obj = responseData as Record<string, unknown>;
        // If response has a 'data' field, return that
        if ('data' in obj) {
          return obj.data as T;
        }
      }

      return responseData as T;
    } catch (error) {
      // Re-throw ApiError instances
      if (this.isApiError(error)) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw this.createError('Network error. Please check your connection.', 0);
      }

      // Handle unknown errors
      throw this.createError('An unexpected error occurred', 0);
    }
  }

  /**
   * Check if error is an ApiError
   */
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'statusCode' in error
    );
  }

  /**
   * Create a formatted ApiError
   */
  private createError(message: string, statusCode: number, code?: string): ApiError {
    return {
      message,
      statusCode,
      code,
    };
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
