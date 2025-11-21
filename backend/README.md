# MicroCare Backend

A professional, scalable backend API for the MicroCare mental health and wellness journaling application.

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

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 12+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build TypeScript:
```bash
npm run build
```

### Development

Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

### Production

Build and start:
```bash
npm run build
npm start
```

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
