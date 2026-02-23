# Frontend-Backend Integration Testing Guide

## Overview

This guide covers comprehensive testing of the frontend and backend integration for the MicroCare application.

## Test Setup & Prerequisites

### 1. Ensure Backend is Running

```bash
cd backend
npm run dev
```

The backend should be accessible at `http://localhost:3000`

### 2. Ensure Database is Ready

```bash
cd backend
npm run db:migrate
```

### 3. Frontend Test Files

Integration tests are located in:
- `/frontend/src/tests/integration/api.integration.test.ts` - API endpoint testing
- `/frontend/src/tests/integration/hooks.integration.test.ts` - React hooks testing

## Test Suites

### 1. API Integration Tests (`api.integration.test.ts`)

Tests direct API communication between frontend and backend.

#### Test Categories:

**Authentication - Registration**
- Register a new user
- Reject duplicate email registration
- Reject invalid email format
- Reject weak passwords

**Authentication - Login**
- Login with valid credentials
- Reject invalid email
- Reject incorrect password

**Journal Entries Management**
- Create entries
- Fetch entries with pagination
- Get specific entry by ID
- Update entries
- Delete entries
- Handle non-existent entries (404)

**User Profile Management**
- Fetch user profile
- Update user profile
- Validate email during update

**Authentication Requirements**
- Reject requests without token
- Allow unauthenticated access to registration/login

### 2. Hooks Integration Tests (`hooks.integration.test.ts`)

Tests React hooks that wrap the API client.

#### Test Categories:

**useEntries Hook**
- Initialize with default state
- Fetch entries successfully
- Create new entries
- Get entry by ID
- Update entries
- Delete entries
- Handle pagination
- Error handling

**useProfile Hook**
- Initialize with null profile
- Fetch user profile
- Update profile information
- Change password
- Handle errors gracefully

## Running Tests

### Run All Integration Tests

```bash
# Frontend
cd frontend
npm test -- api.integration.test.ts hooks.integration.test.ts
```

### Run Specific Test Suite

```bash
# Test API integration only
npm test -- api.integration.test.ts

# Test hooks integration only
npm test -- hooks.integration.test.ts
```

### Run Specific Test Group

```bash
# Jest allows filtering by test name pattern
npm test -- api.integration.test.ts -t "Authentication"
npm test -- api.integration.test.ts -t "Journal Entries"
npm test -- hooks.integration.test.ts -t "useEntries"
```

### Watch Mode (for development)

```bash
npm test -- --watch
```

## Test Data Management

### Automatic Test User Creation

Each test run creates unique test users with timestamps:
```
integration-test-${Date.now()}@example.com
```

This ensures tests don't conflict with existing data.

### Cleanup

Test data is intentionally left in the database for:
- Manual inspection
- Data integrity verification
- Audit trail

To manually clean up test data:

```bash
# Using the backend API
curl -X DELETE http://localhost:3000/api/v1/admin/test-users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or directly via database:
```sql
-- Delete test users and their data
DELETE FROM "JournalEntry" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%integration-test-%'
);

DELETE FROM "User" 
WHERE email LIKE '%integration-test-%';
```

## API Testing with Postman

### Quick Start

1. Import the API collection (when created)
2. Set environment variables:
   - `baseUrl`: http://localhost:3000
   - `token`: Your JWT token

### Manual API Testing Flow

```
1. Register User (POST /api/v1/auth/register)
   {
     "email": "test@example.com",
     "password": "TestPassword123!",
     "name": "Test User"
   }

2. Copy accessToken from response

3. Login (POST /api/v1/auth/login)
   {
     "email": "test@example.com",
     "password": "TestPassword123!"
   }

4. Use returned token for subsequent requests

5. Get Profile (GET /api/v1/users/profile)
   Headers: Authorization: Bearer <token>

6. Create Entry (POST /api/v1/entries)
   Headers: Authorization: Bearer <token>
   {
     "title": "My Entry",
     "content": "Content here",
     "mood": "happy",
     "tags": ["tag1"]
   }

7. Fetch Entries (GET /api/v1/entries?page=1&limit=10)
   Headers: Authorization: Bearer <token>
```

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/microcare
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## Common Issues & Troubleshooting

### Issue: "Cannot find module '@testing-library/react'"

**Solution**: Install testing dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @types/jest
```

### Issue: "Connection refused to localhost:3000"

**Solution**: Ensure backend is running
```bash
cd backend
npm run dev
```

### Issue: "Database migration pending"

**Solution**: Run migrations
```bash
cd backend
npm run db:migrate
```

### Issue: "401 Unauthorized" errors

**Solution**: 
- Check token expiration
- Verify `apiClient.setToken()` is called after login
- Check `localStorage` for stored tokens

### Issue: Tests timeout

**Solution**:
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check backend connectivity
- Verify database is responsive

## Performance Testing

### Load Testing the API

```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:3000/api/health

# Using curl in a loop
for i in {1..100}; do
  curl http://localhost:3000/api/health
done
```

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Manual workflow dispatch

### GitHub Actions Workflow

```yaml
name: Integration Tests
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:12
        env:
          POSTGRES_DB: microcare_test
          POSTGRES_PASSWORD: password
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm ci && npm run db:migrate
      - run: cd backend && npm run dev &
      - run: cd frontend && npm ci && npm test
```

## Best Practices

1. **Always register/login before making authenticated requests**
   ```typescript
   const authResponse = await apiClient.post('/api/v1/auth/register', {...});
   apiClient.setToken(authResponse.accessToken, authResponse.refreshToken);
   ```

2. **Clean up resources in afterEach/afterAll**
   ```typescript
   afterAll(async () => {
     // Cleanup test data
   });
   ```

3. **Use descriptive test names**
   ```typescript
   it('should reject entry creation without title')
   ```

4. **Test both success and error cases**
   ```typescript
   it('should create entry successfully')
   it('should reject entry without title')
   ```

5. **Verify state changes**
   ```typescript
   expect(result.current.entries).toBeDefined();
   expect(result.current.isLoading).toBe(false);
   expect(result.current.error).toBeNull();
   ```

6. **Use unique identifiers for test data**
   ```typescript
   email: `test-${Date.now()}@example.com`
   ```

## Debugging Tests

### Enable Verbose Logging

```bash
npm test -- --verbose
```

### Debug Specific Test

```bash
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand api.integration.test.ts
```

Then open `chrome://inspect` in Chrome DevTools.

### Log API Responses

```typescript
const response = await apiClient.get('/api/v1/entries');
console.log('Response:', JSON.stringify(response, null, 2));
```

## Generating Test Reports

### HTML Report

```bash
npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}'
```

### JUnit Report

```bash
npm test -- --reporters=default --reporters=jest-junit
```

## Next Steps

1. Install testing dependencies
2. Run integration tests
3. Fix any failing tests
4. Set up CI/CD pipeline
5. Create Postman collection for manual testing
6. Document API contracts in OpenAPI spec

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Postman Learning Center](https://learning.postman.com/)
- [Backend E2E Tests](../../backend/src/e2e-*.test.ts)

## Contact & Support

For issues or questions about integration testing:
1. Check the test output for error messages
2. Review API documentation at `http://localhost:3000/api/docs`
3. Check backend logs: `npm run dev` output
4. Review database state directly
