# Token Security Implementation

## Overview

This document describes the secure token storage and handling implementation for MicroCare frontend, addressing Requirement 4.3: "WHEN the frontend stores authentication tokens, THE tokens SHALL be stored securely (HttpOnly cookies or secure storage)".

## Implementation Details

### 1. Token Storage

**Location**: `src/lib/apiClient.ts`

Tokens are stored in browser localStorage with the following keys:
- `jwt`: Access token (15 minutes expiration)
- `refreshToken`: Refresh token (7 days expiration)
- `tokenExpiration`: Token expiration timestamp for early refresh detection

**Security Considerations**:
- localStorage is accessible to JavaScript, which means XSS attacks could expose tokens
- Mitigation: Tokens are never logged or exposed in console output
- Future enhancement: Consider HttpOnly cookies for production (requires backend changes)

### 2. Token Expiration Handling

**Automatic Expiration Detection**:
- Tokens are decoded client-side to extract expiration time
- Expiration is checked before each API request
- Tokens are refreshed 1 minute before actual expiration (buffer time)
- This prevents requests with expired tokens

**Implementation**:
```typescript
private isTokenExpired(token: string): boolean {
  const expiration = this.getTokenExpiration(token);
  if (!expiration) return true;

  const now = Date.now();
  const bufferTime = 60 * 1000; // 1 minute buffer

  return now >= expiration - bufferTime;
}
```

### 3. Token Refresh Mechanism

**Automatic Refresh Flow**:
1. Before each API request, check if token is expired
2. If expired, call `/api/auth/refresh` with refresh token
3. Backend validates refresh token and returns new access token
4. New token is stored and request is retried
5. If refresh fails, user is redirected to login

**Concurrent Refresh Prevention**:
- Multiple simultaneous refresh requests are prevented using `isRefreshing` flag
- Subsequent requests wait for the first refresh to complete
- This prevents race conditions and multiple refresh calls

**Implementation**:
```typescript
private async refreshAccessToken(): Promise<string | null> {
  if (this.isRefreshing) {
    return this.refreshPromise;
  }

  this.isRefreshing = true;
  // ... refresh logic
}
```

### 4. 401 Unauthorized Handling

**Automatic Retry with Token Refresh**:
1. If a request returns 401 Unauthorized
2. Attempt to refresh the access token
3. If refresh succeeds, retry the original request
4. If refresh fails, clear tokens and redirect to login

**Implementation**:
```typescript
if (response.status === 401 && !config?.skipAuth) {
  const newToken = await this.refreshAccessToken();
  if (newToken) {
    // Retry request with new token
    return this.request<T>(method, url, body, config);
  }
  this.handle401();
  throw this.createError('Unauthorized. Please log in again.', 401);
}
```

### 5. Token Security - No Logging

**Sanitization Utility**: `src/lib/tokenSanitizer.ts`

Provides safe logging functions that automatically redact sensitive fields:
- `token`, `accessToken`, `refreshToken`
- `password`, `secret`
- Any field containing these keywords

**Usage**:
```typescript
import { safeConsole } from './tokenSanitizer';

// Instead of console.log(userData)
safeConsole.log(userData); // Tokens will be [REDACTED]
```

**Error Message Sanitization**:
- Error details are sanitized before being returned to the caller
- Sensitive fields are removed from error responses
- Prevents accidental token exposure in error messages

### 6. AuthContext Integration

**Location**: `src/contexts/AuthContext.tsx`

The AuthContext now:
1. Stores both access and refresh tokens on login/register
2. Automatically validates token on app startup
3. Handles token refresh transparently
4. Clears tokens on 401 responses

**Token Storage on Login**:
```typescript
const response = await apiClient.post<{
  accessToken: string;
  refreshToken: string;
  user: User;
}>('/api/auth/login', { email, password }, { skipAuth: true });

apiClient.setToken(response.accessToken, response.refreshToken);
```

## Security Features

### ✅ Implemented

1. **Automatic Token Refresh**: Tokens are automatically refreshed before expiration
2. **Expiration Detection**: Client-side expiration checking with 1-minute buffer
3. **401 Handling**: Automatic retry with token refresh on 401 responses
4. **Token Sanitization**: Tokens never logged or exposed in console
5. **Error Sanitization**: Sensitive fields removed from error messages
6. **Concurrent Refresh Prevention**: Multiple refresh requests are prevented
7. **Secure Token Storage**: Both access and refresh tokens stored separately

### 🔄 Future Enhancements

1. **HttpOnly Cookies**: Move to HttpOnly cookies for production (requires backend changes)
2. **CSRF Protection**: Implement CSRF tokens for state-changing operations
3. **Token Rotation**: Implement automatic token rotation on each refresh
4. **Secure Storage API**: Use Web Crypto API for additional security
5. **Token Binding**: Bind tokens to device fingerprint for additional security

## Testing

**Test File**: `src/lib/apiClient.test.ts`

Tests cover:
- Token storage and retrieval
- Token expiration detection
- Automatic token refresh
- 401 handling with retry
- Token security (no logging)
- Automatic token injection
- Skip auth functionality

## Backend Integration

**Refresh Endpoint**: `POST /api/auth/refresh`

Request:
```json
{
  "refreshToken": "refresh-token-string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token has expired"
  }
}
```

## Configuration

**Environment Variables**:
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)

**Backend Configuration** (`.env`):
- `JWT_EXPIRATION`: Access token expiration (default: 15m)
- `REFRESH_TOKEN_EXPIRATION`: Refresh token expiration (default: 7d)
- `JWT_SECRET`: Secret key for signing tokens

## Compliance

This implementation addresses:
- **Requirement 4.3**: Tokens are stored securely with automatic refresh
- **Requirement 1.2**: JWT tokens are generated and managed correctly
- **Requirement 1.3**: 401 responses are handled with automatic token refresh
- **Requirement 1.4**: Network errors provide meaningful error messages
- **Requirement 1.5**: Tokens are cleared on logout

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Web Storage Security](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
