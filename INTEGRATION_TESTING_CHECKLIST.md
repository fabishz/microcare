# MicroCare Frontend-Backend API Integration Testing Checklist

## Pre-Testing Checklist

### Environment Setup
- [ ] Backend running on `http://localhost:3000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] PostgreSQL database running
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] Environment variables configured
- [ ] Node modules installed (`npm install`)

### Tools Available
- [ ] Postman or Insomnia installed (for manual testing)
- [ ] Browser DevTools available (F12)
- [ ] Terminal/CLI access
- [ ] IDE with REST client extension

---

## Authentication Testing

### User Registration
- [ ] **Success Case**: User can register with valid credentials
  - Email: valid format
  - Password: meets strength requirements
  - Name: provided
  - Response: Contains `accessToken`, `refreshToken`, and user data

- [ ] **Error Cases**:
  - [ ] Duplicate email → 400 Bad Request
  - [ ] Invalid email format → 400 Bad Request  
  - [ ] Weak password → 400 Bad Request
  - [ ] Missing required fields → 400 Bad Request

### User Login
- [ ] **Success Case**: User can login with correct credentials
  - Email: registered user
  - Password: correct password
  - Response: Contains valid `accessToken` and `refreshToken`

- [ ] **Error Cases**:
  - [ ] Non-existent email → 401 Unauthorized
  - [ ] Wrong password → 401 Unauthorized
  - [ ] Empty credentials → 400 Bad Request

### Token Management
- [ ] **Token Refresh**: Access token can be refreshed with refresh token
  - Old token expires → uses refresh token
  - New token is returned
  - Subsequent requests work with new token

- [ ] **Token Expiration**: 
  - [ ] Access token expires after 15 minutes
  - [ ] Refresh token can extend session
  - [ ] Expired token returns 401

- [ ] **Token Security**:
  - [ ] Tokens stored in localStorage
  - [ ] Tokens not exposed in console
  - [ ] Invalid token rejected

---

## User Profile Testing

### Fetch Profile
- [ ] **Authenticated User**: 
  - [ ] GET `/api/v1/users/profile` returns user profile
  - [ ] Profile contains: `id`, `email`, `name`, `createdAt`, `updatedAt`
  - [ ] Profile matches logged-in user

- [ ] **Unauthenticated**: 
  - [ ] Request without token → 401 Unauthorized
  - [ ] Request with invalid token → 401 Unauthorized

### Update Profile
- [ ] **Valid Updates**:
  - [ ] Update name only
  - [ ] Update email (to valid, new email)
  - [ ] Update both name and email
  - [ ] Response reflects changes
  - [ ] Changes persist on subsequent fetch

- [ ] **Invalid Updates**:
  - [ ] Invalid email format → 400 Bad Request
  - [ ] Duplicate email (existing user) → 400 Bad Request
  - [ ] Empty name → 400 Bad Request or validation error

### Change Password
- [ ] **Successful Change**:
  - [ ] Correct current password provided
  - [ ] New password meets requirements
  - [ ] Old password no longer works
  - [ ] New password works for login

- [ ] **Failed Change**:
  - [ ] Wrong current password → 401 Unauthorized
  - [ ] Weak new password → 400 Bad Request
  - [ ] Missing current password → 400 Bad Request

---

## Journal Entries Testing

### Create Entry
- [ ] **Valid Entry**:
  - [ ] Required fields: `title`, `content`
  - [ ] Optional fields: `mood`, `tags`
  - [ ] Response contains: `id`, `userId`, `createdAt`, `updatedAt`
  - [ ] Entry associated with correct user

- [ ] **Invalid Entry**:
  - [ ] Missing title → 400 Bad Request
  - [ ] Missing content → 400 Bad Request
  - [ ] Empty title → 400 Bad Request
  - [ ] Empty content → 400 Bad Request

- [ ] **Authentication**:
  - [ ] Unauthenticated request → 401 Unauthorized
  - [ ] Invalid token → 401 Unauthorized

### Fetch Entries
- [ ] **List All Entries**:
  - [ ] GET `/api/v1/entries` returns paginated results
  - [ ] Each entry contains required fields
  - [ ] Only authenticated user's entries returned
  - [ ] Entries sorted by `createdAt` (newest first)

- [ ] **Pagination**:
  - [ ] Query param `page` works (default: 1)
  - [ ] Query param `limit` works (default: 10)
  - [ ] Response contains `total`, `page`, `limit`, `totalPages`
  - [ ] `data` array respects limit
  - [ ] Page beyond total returns empty array

- [ ] **Get Single Entry**:
  - [ ] GET `/api/v1/entries/:id` returns specific entry
  - [ ] Non-existent ID → 404 Not Found
  - [ ] Other user's entry → 403 Forbidden (or 404)

### Update Entry
- [ ] **Partial Update**:
  - [ ] Update title only
  - [ ] Update content only
  - [ ] Update mood only
  - [ ] Update tags only
  - [ ] Update multiple fields
  - [ ] Unchanged fields preserved

- [ ] **Error Cases**:
  - [ ] Non-existent ID → 404 Not Found
  - [ ] Other user's entry → 403 Forbidden
  - [ ] Invalid update data → 400 Bad Request

### Delete Entry
- [ ] **Successful Delete**:
  - [ ] DELETE removes entry
  - [ ] Subsequent GET returns 404
  - [ ] Not in entry list anymore

- [ ] **Error Cases**:
  - [ ] Non-existent ID → 404 Not Found
  - [ ] Other user's entry → 403 Forbidden
  - [ ] Unauthenticated → 401 Unauthorized

---

## API Response Format Testing

### Success Response
- [ ] Response format matches specification:
  ```json
  {
    "success": true,
    "data": { /* resource data */ },
    "timestamp": "ISO-8601 timestamp"
  }
  ```

### Error Response
- [ ] Response format matches specification:
  ```json
  {
    "success": false,
    "error": {
      "message": "Error description",
      "details": { /* validation errors */ }
    },
    "timestamp": "ISO-8601 timestamp"
  }
  ```

### HTTP Status Codes
- [ ] 200 OK - Successful GET/PUT
- [ ] 201 Created - Successful POST
- [ ] 204 No Content - Successful DELETE
- [ ] 400 Bad Request - Validation errors
- [ ] 401 Unauthorized - Auth required/invalid
- [ ] 403 Forbidden - Insufficient permissions
- [ ] 404 Not Found - Resource not found
- [ ] 429 Too Many Requests - Rate limit exceeded
- [ ] 500 Internal Server Error - Server error

---

## Cross-Origin (CORS) Testing

- [ ] **CORS Headers Present**:
  - [ ] `Access-Control-Allow-Origin` set correctly
  - [ ] `Access-Control-Allow-Methods` includes: GET, POST, PUT, DELETE
  - [ ] `Access-Control-Allow-Headers` includes: Content-Type, Authorization

- [ ] **Preflight Requests**:
  - [ ] OPTIONS requests return 200
  - [ ] Preflight response includes correct headers
  - [ ] Subsequent actual request succeeds

---

## Rate Limiting Testing

- [ ] **Rate Limiting Active** (if configured):
  - [ ] Multiple rapid requests throttled
  - [ ] 429 error returned when limit exceeded
  - [ ] Proper `Retry-After` header present
  - [ ] Different endpoints have appropriate limits

---

## Data Validation Testing

### Email Validation
- [ ] Valid emails accepted: `user@example.com`, `test.user@example.co.uk`
- [ ] Invalid emails rejected: `user@`, `@example.com`, `user@.com`

### Password Validation
- [ ] Minimum length: 8 characters
- [ ] Must contain: uppercase, lowercase, number, special char
- [ ] Weak passwords rejected: `password123`, `12345678`, `abcdefgh`

### Entry Fields
- [ ] Title: 1-200 characters
- [ ] Content: 1-10000 characters
- [ ] Mood: Valid enum values
- [ ] Tags: Array of strings, reasonable limit

---

## Security Testing

- [ ] **SQL Injection**: API safely handles special characters
- [ ] **XSS Protection**: Response doesn't allow unescaped HTML
- [ ] **CSRF Protection**: State-changing requests require proper headers
- [ ] **Token Security**: Tokens don't expose sensitive info when decoded
- [ ] **Password Security**: Passwords hashed, never returned in response

---

## Frontend Integration Testing

### API Client
- [ ] `apiClient` properly injects Authorization header
- [ ] Tokens managed correctly (set, get, clear)
- [ ] Token refresh happens automatically
- [ ] Error responses handled properly
- [ ] Network errors caught and reported

### React Hooks
- [ ] `useEntries` hook state management works
- [ ] `useProfile` hook state management works
- [ ] Loading states properly set during requests
- [ ] Error states properly captured
- [ ] Data updates trigger component re-renders

### React Components
- [ ] Login form submits correctly
- [ ] Profile form updates user data
- [ ] Entry creation works
- [ ] Entry list displays with pagination
- [ ] Entry edit/delete works
- [ ] Loading spinners shown during requests
- [ ] Error messages displayed
- [ ] Success messages/redirects work

---

## Performance Testing

- [ ] **Response Times**:
  - [ ] Login < 500ms
  - [ ] Get profile < 200ms
  - [ ] Create entry < 500ms
  - [ ] Fetch entries < 500ms
  - [ ] Update entry < 500ms
  - [ ] Delete entry < 200ms

- [ ] **Load Testing** (optional):
  - [ ] 100 concurrent requests handled
  - [ ] Response times reasonable under load
  - [ ] No connection pool exhaustion
  - [ ] Graceful degradation if needed

---

## Browser Compatibility

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Error Recovery Testing

- [ ] **Network Errors**:
  - [ ] Offline mode handled gracefully
  - [ ] Retry logic works
  - [ ] User notified of errors

- [ ] **API Errors**:
  - [ ] 500 errors shown to user
  - [ ] 4xx errors show helpful messages
  - [ ] Retry possible for failed operations

---

## Documentation

- [ ] [ ] README has integration testing section
- [ ] [ ] API endpoints documented
- [ ] [ ] Error codes documented
- [ ] [ ] Example requests/responses provided
- [ ] [ ] Troubleshooting guide exists

---

## Sign-Off

- [ ] All checks completed
- [ ] No critical issues found
- [ ] Frontend-backend integration verified
- [ ] Ready for deployment

**Tested By**: ________________  
**Date**: ________________  
**Notes**: ________________________________________________

---

## Quick Test Commands

### Run All Integration Tests
```bash
./run-integration-tests.sh
```

### Run API Tests Only
```bash
./run-integration-tests.sh api
```

### Run Hooks Tests Only
```bash
./run-integration-tests.sh hooks
```

### Manual API Test (using curl)
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get Profile (replace TOKEN)
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman
1. Import API collection
2. Set `baseUrl` variable to `http://localhost:3000`
3. Follow the pre-configured test workflows

---

## Additional Resources

- [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) - Detailed testing guide
- [Backend API Docs](../backend/API.md)
- [Backend E2E Tests](../backend/src/e2e-*.test.ts)
