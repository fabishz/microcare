# Implementation Plan: MicroCare Backend

## Phase 1: Project Setup and Infrastructure

- [x] 1. Initialize Node.js project with TypeScript configuration
  - Create new Node.js project directory structure
  - Install dependencies: express, typescript, ts-node, dotenv, cors
  - Configure tsconfig.json for strict type checking
  - Set up .env file with environment variables (DB_URL, JWT_SECRET, PORT)
  - Create src/ directory structure: controllers/, services/, repositories/, middleware/, utils/, types/
  - _Requirements: 6.1, 6.2_

- [x] 2. Set up PostgreSQL database connection and pooling (Use Prisma ORM)

  - Implement connection error handling and retry logic
  - Create database initialization script
  - _Requirements: 5.1, 5.2_

- [x] 3. Create database schema and migrations
  - Create users table with email uniqueness constraint
  - Create journal_entries table with foreign key to users
  - Add indexes on user_id and created_at for performance
  - Create migration system for schema versioning
  - _Requirements: 5.1, 5.3, 5.5_

- [x] 4. Set up Express server and middleware stack
  - Create main Express application instance
  - Configure CORS middleware with frontend domain whitelist
  - Add request logging middleware
  - Add global error handling middleware
  - Add request body parsing middleware (JSON)
  - _Requirements: 6.2, 7.4_

## Phase 2: Authentication System

- [x] 5. Implement JWT token management utilities
  - Create JWT token generation function with configurable expiration
  - Create JWT token verification function
  - Implement refresh token logic
  - Add token payload type definitions
  - _Requirements: 1.2, 7.3_

- [x] 6. Implement password hashing utilities
  - Create bcrypt-based password hashing function (10+ salt rounds)
  - Create password comparison function
  - Add password validation rules (minimum length, complexity)
  - _Requirements: 1.1, 7.1_

- [x] 7. Create authentication middleware
  - Implement JWT verification middleware
  - Extract user information from token and attach to request
  - Handle expired and invalid tokens with 401 response
  - _Requirements: 1.3, 1.4_

- [x] 8. Implement AuthService with registration and login logic
  - Create user registration service with email validation
  - Implement duplicate email checking
  - Create login service with credential verification
  - Generate JWT tokens on successful authentication
  - _Requirements: 1.1, 1.2_

- [x] 9. Create AuthController and authentication routes
  - Implement POST /api/auth/register endpoint
  - Implement POST /api/auth/login endpoint
  - Implement POST /api/auth/logout endpoint
  - Implement POST /api/auth/refresh endpoint
  - Add input validation for all endpoints
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

## Phase 3: User Profile Management

- [x] 10. Create UserRepository for database operations
  - Implement findById query
  - Implement findByEmail query
  - Implement create user query
  - Implement update user query
  - _Requirements: 5.1, 5.5_

- [x] 11. Implement UserService with profile operations
  - Create getUserProfile service method
  - Create updateUserProfile service method with validation
  - Create changePassword service method
  - Add authorization checks for profile updates
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 12. Create UserController and profile routes
  - Implement GET /api/users/profile endpoint
  - Implement PUT /api/users/profile endpoint
  - Implement POST /api/users/change-password endpoint
  - Add authentication requirement to all endpoints
  - Add input validation for profile updates
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

## Phase 4: Journal Entry Management

- [x] 13. Create EntryRepository for journal entry database operations
  - Implement create entry query
  - Implement findById query with ownership verification
  - Implement findByUserId query with pagination
  - Implement update entry query
  - Implement delete entry query
  - Add indexes for performance optimization
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 14. Implement EntryService with CRUD logic
  - Create createEntry service with validation
  - Create getEntry service with ownership check
  - Create getUserEntries service with pagination support
  - Create updateEntry service with ownership verification
  - Create deleteEntry service with ownership verification
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 15. Create EntryController and journal entry routes
  - Implement POST /api/entries endpoint
  - Implement GET /api/entries endpoint with pagination
  - Implement GET /api/entries/:id endpoint
  - Implement PUT /api/entries/:id endpoint
  - Implement DELETE /api/entries/:id endpoint
  - Add authentication requirement to all endpoints
  - Add input validation for all endpoints
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

## Phase 5: Validation and Error Handling

- [x] 16. Create input validation utilities and schemas
  - Create email validation function
  - Create password validation function
  - Create journal entry validation schemas
  - Create user profile validation schemas
  - _Requirements: 4.1, 4.2_

- [x] 17. Implement comprehensive error handling
  - Create custom error classes (ValidationError, AuthError, NotFoundError, etc.)
  - Implement error response formatter
  - Add error logging to global error handler
  - Ensure all errors return appropriate HTTP status codes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 18. Add rate limiting to authentication endpoints
  - Install rate limiting middleware
  - Configure rate limiting for /api/auth/login and /api/auth/register
  - Return 429 status code when limit exceeded
  - _Requirements: 4.5_

## Phase 6: API Documentation and Testing

- [x] 19. Create OpenAPI/Swagger documentation
  - Install swagger-ui-express and swagger-jsdoc
  - Document all endpoints with request/response schemas
  - Add authentication requirements to documentation
  - Create /api/docs endpoint for Swagger UI
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 20. Implement unit tests for services
  - Write tests for AuthService (registration, login, token generation)
  - Write tests for UserService (profile operations, password changes)
  - Write tests for EntryService (CRUD operations, ownership checks)
  - Write tests for validation utilities
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 21. Implement integration tests for API endpoints
  - Write tests for authentication flow (register → login → access protected endpoint)
  - Write tests for user profile endpoints
  - Write tests for journal entry endpoints with pagination
  - Write tests for error scenarios (401, 403, 404, 400)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3_

## Phase 7: Security Hardening and Deployment Preparation

- [ ] 22. Implement security best practices
  - Add helmet middleware for security headers
  - Implement input sanitization
  - Add HTTPS enforcement in production
  - Configure secure JWT secret management
  - Add request size limits
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 23. Create health check and monitoring endpoints
  - Implement GET /api/health endpoint
  - Add database connectivity check
  - Create startup verification script
  - _Requirements: 6.2_

- [ ] 24. Set up environment configuration and deployment files
  - Create .env.example file with all required variables
  - Create production environment configuration
  - Add database migration scripts
  - Create startup script in package.json
  - _Requirements: 5.1, 6.2_
