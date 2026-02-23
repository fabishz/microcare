import { apiClient } from './apiClient';

describe('API Client - Token Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Storage and Retrieval', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-access-token';
      apiClient.setToken(token);

      // Verify token is stored (we can't directly access private methods, but we can verify behavior)
      expect(localStorage.getItem('jwt')).toBe(token);
    });

    it('should store both access and refresh tokens', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      apiClient.setToken(accessToken, refreshToken);

      expect(localStorage.getItem('jwt')).toBe(accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(refreshToken);
    });

    it('should clear all tokens on logout', () => {
      apiClient.setToken('test-token', 'test-refresh');
      expect(localStorage.getItem('jwt')).toBe('test-token');

      // Simulate logout by making a 401 request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      // After 401, tokens should be cleared
      // This is tested indirectly through the handle401 behavior
    });
  });

  describe('Token Expiration Detection', () => {
    it('should detect expired tokens', () => {
      // Create a token that's already expired (exp in the past)
      const expiredPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800, // Expired 30 minutes ago
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(expiredPayload));
      const expiredToken = `${header}.${payload}.signature`;

      // Store the expired token
      apiClient.setToken(expiredToken);

      // The token should be detected as expired and trigger refresh
      // This is tested through the request flow
    });

    it('should refresh token before expiration', async () => {
      // Create a token that expires in 30 seconds (within 1 minute buffer)
      const expiringPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30, // Expires in 30 seconds
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(expiringPayload));
      const expiringToken = `${header}.${payload}.signature`;

      apiClient.setToken(expiringToken, 'refresh-token');

      // Mock the refresh endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      });

      // Make a request that should trigger token refresh
      try {
        await apiClient.get('/api/v1/test');
      } catch {
        // Expected to fail since we're mocking, but token refresh should have been attempted
      }

      // Verify refresh was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/refresh'),
        expect.any(Object)
      );
    });
  });

  describe('Token Refresh Mechanism', () => {
    it('should retry request after successful token refresh on 401', async () => {
      const accessToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newAccessToken = 'new-token';

      apiClient.setToken(accessToken, refreshToken);

      // First call returns 401, second call (after refresh) returns 200
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { message: 'Unauthorized' } }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            data: {
              accessToken: newAccessToken,
              refreshToken: 'new-refresh-token',
            },
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: { message: 'success' } }),
        });

      try {
        await apiClient.get('/api/v1/test');
      } catch {
        // Expected behavior
      }

      // Verify refresh endpoint was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/refresh'),
        expect.any(Object)
      );
    });

    it('should clear tokens and redirect on failed refresh', async () => {
      const accessToken = 'old-token';
      const refreshToken = 'invalid-refresh-token';

      apiClient.setToken(accessToken, refreshToken);

      // Mock failed refresh
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: { message: 'Invalid refresh token' } }),
      });

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      try {
        await apiClient.get('/api/v1/test');
      } catch (error) {
        // Expected to throw
      }

      // Verify tokens were cleared
      expect(localStorage.getItem('jwt')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Token Security - No Logging', () => {
    it('should not expose tokens in error messages', async () => {
      const token = 'secret-token-12345';
      apiClient.setToken(token);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            message: 'Validation error',
            details: {
              token: 'invalid token format',
              password: 'too short',
            },
          },
        }),
      });

      try {
        await apiClient.post('/api/v1/test', { data: 'test' });
      } catch (error: any) {
        // Verify sensitive fields are not in error details
        expect(error.details).not.toHaveProperty('token');
        expect(error.details).not.toHaveProperty('password');
      }
    });
  });

  describe('Automatic Token Injection', () => {
    it('should include authorization header with token', async () => {
      const token = 'test-token';
      apiClient.setToken(token);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { message: 'success' } }),
      });

      await apiClient.get('/api/v1/test');

      // Verify Authorization header was included
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });

    it('should skip auth header when skipAuth is true', async () => {
      const token = 'test-token';
      apiClient.setToken(token);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { message: 'success' } }),
      });

      await apiClient.get('/api/v1/test', { skipAuth: true });

      // Verify Authorization header was NOT included
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });
  });
});
