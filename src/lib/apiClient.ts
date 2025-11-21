/**
 * Centralized API Client with Token Management
 * Handles automatic JWT token injection, error handling, and 401 responses
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

class ApiClient {
  private baseUrl: string;
  private tokenKey = 'jwt';

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
   * Clear the stored JWT token
   */
  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Set the JWT token
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Build request headers with automatic token injection
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
          details: (error.details as Record<string, unknown>) || undefined,
        };
      }

      if (errorObj.message) {
        return {
          message: errorObj.message as string,
          statusCode: response.status,
          code: (errorObj.code as string) || undefined,
          details: (errorObj.details as Record<string, unknown>) || undefined,
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
   * Handle 401 Unauthorized responses
   */
  private handle401(): void {
    this.clearToken();
    // Redirect to login page
    window.location.href = '/login';
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
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

      // Handle 401 Unauthorized
      if (response.status === 401) {
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
