# MicroCare Backend

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue)

A professional, scalable backend API for the **MicroCare** mental health and wellness journaling application. Built with Node.js, Express, and TypeScript, following industry best practices for security and maintainability.


## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Project Structure

```
src/
├── controllers/      # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── middleware/      # Express middleware
├── utils/          # Utility functions and helpers
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Quick Start

### Prerequisites

-   Node.js 18+ (tested with v20+)
-   PostgreSQL 12+

### Installation & Setup

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/your-username/microcare-backend.git
    cd microcare-backend
    npm install
    ```

2.  **Environment Setup**:
    Run the setup script to create your `.env` file:
    ```bash
    npm run setup
    ```
    > **Important**: Open `.env` and update `DATABASE_URL` with your local PostgreSQL credentials.

3.  **Database Migration**:
    Initialize your database schema:
    ```bash
    npm run db:migrate
    ```

4.  **Start the Server**:
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:3000`.

## Documentation

-   [Contributing Guidelines](CONTRIBUTING.md)
-   [Code of Conduct](CODE_OF_CONDUCT.md)
-   [API Documentation (Guide)](API.md)
-   [Interactive API Docs (Swagger)](src/config/swagger.ts) (Available at `/api/docs` when server is running)
-   [Database Setup](DATABASE_SETUP.md)


## API Endpoints

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

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Linting

```bash
npm run lint
```
