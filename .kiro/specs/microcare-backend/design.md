# Design Document: MicroCare Backend

## Overview

The MicroCare backend is a RESTful API service built with Node.js, Express, and TypeScript, backed by PostgreSQL. The architecture follows a layered approach with clear separation of concerns: controllers handle HTTP requests, services contain business logic, repositories manage data access, and middleware handles cross-cutting concerns like authentication and validation.

The system prioritizes security, scalability, and maintainability through:
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Comprehensive error handling
- Database connection pooling
- Structured logging

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Frontend)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                    Express Server                            │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                                            │
│  ├─ CORS Handler                                            │
│  ├─ Request Logger                                          │
│  ├─ Authentication (JWT Verification)                       │
│  └─ Error Handler                                           │
├─────────────────────────────────────────────────────────────┤
│  Route Layer                                                 │
│  ├─ /api/auth (Authentication routes)                       │
│  ├─ /api/users (User profile routes)                        │
│  └─ /api/entries (Journal entry routes)                     │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer                                            │
│  ├─ AuthController                                          │
│  ├─ UserController                                          │
│  └─ EntryController                                         │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  ├─ AuthService                                             │
│  ├─ UserService                                             │
│  └─ EntryService                                            │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                                            │
│  ├─ UserRepository                                          │
│  ├─ EntryRepository                                         │
│  └─ Database Connection Pool                                │
├─────────────────────────────────────────────────────────────┤
│  Utilities & Helpers                                         │
│  ├─ JWT Token Manager                                       │
│  ├─ Password Hasher (bcrypt)                                │
│  ├─ Validators                                              │
│  └─ Error Handlers                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ├─ users table                                             │
│  ├─ journal_entries table                                   │
│  └─ Indexes & Constraints                                   │
└─────────────────────────────────────────────────────────────┘
```

### Layered Architecture Pattern

1. **Route Layer**: Defines API endpoints and maps HTTP requests to controllers
2. **Controller Layer**: Handles HTTP request/response, delegates to services
3. **Service Layer**: Contains business logic, orchestrates repositories
4. **Repository Layer**: Abstracts database operations, provides data access
5. **Middleware Layer**: Cross-cutting concerns (auth, logging, error handling)
6. **Utilities**: Shared functions (JWT, hashing, validation)

## Components and Interfaces

### 1. Authentication System

**Components:**
- `AuthController`: Handles registration, login, logout, token refresh
- `AuthService`: Manages authentication logic, token generation
- `JWTManager`: Creates and verifies JWT tokens
- `PasswordHasher`: Hashes and compares passwords using bcrypt

**Key Interfaces:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

### 2. User Profile Management

**Components:**
- `UserController`: Handles profile retrieval and updates
- `UserService`: Manages user data operations
- `UserRepository`: Database queries for user data

**Key Interfaces:**

```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### 3. Journal Entry Management

**Components:**
- `EntryController`: Handles CRUD operations for journal entries
- `EntryService`: Business logic for entry management
- `EntryRepository`: Database queries for entries

**Key Interfaces:**

```typescript
interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateEntryRequest {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

interface UpdateEntryRequest {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}

interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt';
  order?: 'ASC' | 'DESC';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 4. Middleware Stack

**Components:**
- `AuthMiddleware`: Verifies JWT tokens and attaches user to request
- `ErrorHandler`: Catches and formats errors
- `RequestLogger`: Logs incoming requests
- `ValidationMiddleware`: Validates request bodies against schemas
- `CORSMiddleware`: Handles cross-origin requests

**Key Interfaces:**

```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, string>;
  timestamp: Date;
}
```

## Data Models

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries Table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

### TypeScript Types

```typescript
// User Entity
type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

// Journal Entry Entity
type JournalEntry = {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
};

// API Response Wrapper
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: Date;
};
```

## Error Handling

### Error Classification

1. **Validation Errors (400)**: Invalid input data
2. **Authentication Errors (401)**: Missing or invalid credentials
3. **Authorization Errors (403)**: Insufficient permissions
4. **Not Found Errors (404)**: Resource doesn't exist
5. **Conflict Errors (409)**: Resource already exists (e.g., duplicate email)
6. **Server Errors (500)**: Unexpected server-side failures

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: Date;
}
```

### Error Handling Strategy

- All errors caught by global error handler middleware
- Validation errors include field-level details
- Server errors logged but don't expose internal details to client
- Consistent error response format across all endpoints

## Testing Strategy

### Unit Tests
- Service layer logic (authentication, validation, business rules)
- Repository layer queries and data transformations
- Utility functions (JWT, password hashing, validators)

### Integration Tests
- API endpoint workflows (registration → login → profile access)
- Database operations with real PostgreSQL instance
- Authentication flow with token generation and verification

### Test Coverage Goals
- Services: 80%+ coverage
- Repositories: 75%+ coverage
- Controllers: 60%+ coverage (focus on happy paths)

### Testing Tools
- Jest for test framework
- Supertest for HTTP endpoint testing
- PostgreSQL test database for integration tests

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### User Profile
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password

### Journal Entries
- `POST /api/entries` - Create new entry
- `GET /api/entries` - List user's entries (paginated)
- `GET /api/entries/:id` - Get specific entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

## Security Considerations

1. **Password Security**: Bcrypt with 10+ salt rounds
2. **Token Security**: JWT with 15-minute expiration, refresh tokens with 7-day expiration
3. **Input Validation**: All inputs validated and sanitized
4. **SQL Injection Prevention**: Parameterized queries via ORM/query builder
5. **CORS**: Restricted to frontend domain
6. **HTTPS**: Enforced in production
7. **Rate Limiting**: Implement on authentication endpoints
8. **Logging**: Sensitive data (passwords, tokens) never logged

## Deployment Considerations

- Environment variables for configuration (DB credentials, JWT secret, etc.)
- Database migrations for schema management
- Health check endpoint for monitoring
- Graceful shutdown handling
- Connection pooling for database efficiency
