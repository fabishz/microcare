# Database Setup Guide

This document provides comprehensive instructions for setting up and initializing the MicroCare database for development, staging, and production environments.

## Overview

The MicroCare backend uses PostgreSQL as its primary database with Prisma as the ORM. Database initialization is automated through scripts and migrations to ensure consistency across all environments.

## Quick Start

### Development Environment

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your local database configuration
```

Example `.env.local`:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/microcare_dev
JWT_SECRET=your-dev-secret-key
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

3. **Initialize the database**:
```bash
npm run db:init
```

This command will:
- Verify database connection
- Run all pending migrations
- Verify the schema is up to date

4. **Start the development server**:
```bash
npm run dev
```

Note: The server does not run migrations on startup. Run migrations explicitly during setup or deployment.

## Database Initialization Script

### Location
`backend/scripts/init-db.ts`

### Usage
```bash
npm run db:init
```

### What It Does
1. Loads environment variables from `.env.local`
2. Verifies database connection
3. Runs all pending Prisma migrations
4. Verifies schema is up to date by checking table counts
5. Reports success or failure

### Output Example
```
Starting database initialization...
Verifying database connection...
✓ Database connection successful
Running pending database migrations...
✓ Database migrations completed successfully
✓ Database schema verified (0 users in database)
✓ Database initialization completed successfully
```

## Environment Setup

### Prerequisites

- PostgreSQL 12 or higher
- Node.js 18 or higher
- npm or yarn package manager
- Redis 7+ (for background jobs)

### PostgreSQL Installation

#### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install from https://www.postgresql.org/download/windows/

### Create Development Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE microcare_dev;

# Create user (optional, for security)
CREATE USER microcare_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE microcare_dev TO microcare_user;

# Exit psql
\q
```

### Environment Variables

Create `.env.local` in the `backend` directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/microcare_dev
DATABASE_URL_UNPOOLED=postgresql://postgres:password@localhost:5432/microcare_dev

# JWT Configuration
JWT_SECRET=your-development-secret-key-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Encryption (Base64-encoded 32-byte key)
ENCRYPTION_KEY=replace-with-32-byte-base64-key

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Security
HTTPS_ONLY=false
TRUST_PROXY=false
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Journal Entries Table
```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX journal_entries_userId_idx ON journal_entries(userId);
CREATE INDEX journal_entries_createdAt_idx ON journal_entries(createdAt);
```

## Migration Management

### Running Migrations

#### Development
```bash
# Create and apply a new migration
npm run db:migrate -- --name <migration_name>

# Example
npm run db:migrate -- --name add_user_bio
```

#### Production/Staging
```bash
# Apply all pending migrations without prompting
npm run db:migrate:deploy
```

### Encrypt Existing Entries (if upgrading)

If you are enabling app-level encryption on an existing database, re-encrypt stored entries:

```bash
npm run db:reencrypt
```

### Checking Migration Status
```bash
npx prisma migrate status
```

### Viewing Database
```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555` for visual database management.

## Deployment Scenarios

### New Deployment (Fresh Database)

1. **Set up PostgreSQL instance** (AWS RDS, Google Cloud SQL, etc.)

2. **Configure environment variables**:
```bash
export DATABASE_URL=postgresql://user:password@host:5432/microcare_prod
export JWT_SECRET=your-production-secret-key
export FRONTEND_URL=https://yourdomain.com
```

3. **Run database initialization**:
```bash
npm run db:init
```

4. **Start the application**:
```bash
npm start
```

The application does not run migrations on startup; apply migrations explicitly as part of deployment.

### Existing Deployment (Schema Updates)

1. **Review pending migrations**:
```bash
npx prisma migrate status
```

2. **Backup database** (critical for production):
```bash
# AWS RDS
aws rds create-db-snapshot --db-instance-identifier microcare-prod --db-snapshot-identifier microcare-prod-backup-$(date +%Y%m%d-%H%M%S)

# PostgreSQL direct
pg_dump postgresql://user:password@host:5432/microcare_prod > backup.sql
```

3. **Apply migrations**:
```bash
npm run db:migrate:deploy
```

4. **Verify success**:
```bash
npx prisma migrate status
```

5. **Monitor application logs** for any errors

## Seed Data (Optional)

For testing purposes, you can add seed data to the database:

### Create Seed Script

Create `backend/scripts/seed-db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
    },
  });

  // Create sample entries
  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      title: 'My First Entry',
      content: 'This is a test journal entry.',
      mood: 'happy',
      tags: ['test', 'sample'],
    },
  });

  console.log('✓ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('✗ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Add Script to package.json

```json
{
  "scripts": {
    "db:seed": "ts-node scripts/seed-db.ts"
  }
}
```

### Run Seed Script

```bash
npm run db:seed
```

## Troubleshooting

### Connection Refused

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL is correct
3. Verify database exists: `psql -l`
4. Check credentials are correct

### Migration Fails

**Problem**: Migration fails with SQL error

**Solution**:
1. Check migration status: `npx prisma migrate status`
2. Review the migration file: `prisma/migrations/<timestamp>_<name>/migration.sql`
3. Check database logs for specific errors
4. Restore from backup if needed

### Schema Out of Sync

**Problem**: Prisma schema doesn't match database

**Solution**:
```bash
# Verify and fix schema
npx prisma db push --skip-generate

# Or reset development database (WARNING: deletes all data)
npx prisma migrate reset
```

### Permission Denied

**Problem**: `permission denied for schema public`

**Solution**:
```bash
# Grant permissions to user
psql -U postgres -d microcare_dev -c "GRANT ALL PRIVILEGES ON SCHEMA public TO microcare_user;"
```

## Performance Optimization

### Connection Pooling

For production, use connection pooling:

```bash
# Install pgBouncer or use managed pooling
# Update DATABASE_URL to use pooling endpoint
DATABASE_URL=postgresql://user:password@pooler-host:6432/microcare_prod
```

### Index Strategy

Current indexes optimize:
- User lookups by email (authentication)
- Entry retrieval by user ID
- Chronological entry sorting

### Query Optimization

Monitor slow queries:
```bash
# Enable query logging in PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

## Backup and Recovery

### Automated Backups

For production, enable automated backups:

**AWS RDS**:
- Enable automated backups in RDS console
- Set backup retention period (7-30 days)
- Enable Multi-AZ for high availability

**Google Cloud SQL**:
- Enable automated backups
- Set backup window
- Enable point-in-time recovery

### Manual Backup

```bash
# PostgreSQL dump
pg_dump postgresql://user:password@host:5432/microcare_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
psql postgresql://user:password@host:5432/microcare_prod < backup.sql
```

## Monitoring

### Health Check

```bash
# Check database connectivity
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Database Metrics

Monitor in production:
- Connection count
- Query performance
- Disk usage
- CPU usage
- Memory usage

## Security Best Practices

1. **Use strong passwords** for database users
2. **Enable SSL/TLS** for database connections
3. **Restrict network access** to database (security groups, firewalls)
4. **Use environment variables** for sensitive data
5. **Enable audit logging** for production
6. **Rotate credentials** regularly
7. **Use managed database services** for production
8. **Enable encryption at rest** for sensitive data

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Migrations Guide](./MIGRATIONS.md)
- [Schema Documentation](./SCHEMA_DOCUMENTATION.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Prisma logs: `npx prisma migrate status --verbose`
3. Check PostgreSQL logs
4. Review application logs in `backend/logs/`
