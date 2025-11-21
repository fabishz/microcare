# Database Migrations Guide

This document describes the database migration system for MicroCare backend using Prisma.

## Overview

Prisma handles database migrations automatically. Each migration is stored in the `prisma/migrations` directory with a timestamp and descriptive name.

## Migration Structure

```
prisma/
├── migrations/
│   ├── 0_init/
│   │   └── migration.sql          # Initial schema creation
│   └── migration_lock.toml        # Lock file (do not edit)
├── schema.prisma                  # Prisma schema definition
└── MIGRATIONS.md                  # This file
```

## Initial Migration (0_init)

The initial migration creates:

### Users Table
- `id` (TEXT, PRIMARY KEY): Unique identifier for each user
- `email` (TEXT, UNIQUE): User email address with uniqueness constraint
- `name` (TEXT): User's full name
- `passwordHash` (TEXT): Bcrypt-hashed password
- `createdAt` (TIMESTAMP): Account creation timestamp
- `updatedAt` (TIMESTAMP): Last update timestamp

**Indexes:**
- `users_email_key`: Unique index on email for fast lookups

### Journal Entries Table
- `id` (TEXT, PRIMARY KEY): Unique identifier for each entry
- `userId` (TEXT, FOREIGN KEY): Reference to user who created the entry
- `title` (TEXT): Entry title
- `content` (TEXT): Entry content/body
- `mood` (TEXT, NULLABLE): Optional mood indicator
- `tags` (TEXT[], DEFAULT []): Array of tags for categorization
- `createdAt` (TIMESTAMP): Entry creation timestamp
- `updatedAt` (TIMESTAMP): Last update timestamp

**Indexes:**
- `journal_entries_userId_idx`: Index on userId for fast user entry lookups
- `journal_entries_createdAt_idx`: Index on createdAt for chronological queries

**Foreign Key:**
- `journal_entries_userId_fkey`: References users(id) with CASCADE delete

## Running Migrations

### Development
```bash
npm run db:migrate
```
This command will prompt you to name the migration and apply it to the development database.

### Production
```bash
npm run db:migrate:deploy
```
This command applies all pending migrations without prompting.

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio to view and edit data in the database.

## Creating New Migrations

When you modify `prisma/schema.prisma`:

1. Update the schema file with your changes
2. Run `npm run db:migrate -- --name <migration_name>`
3. Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
4. Commit the migration files to version control

## Migration Best Practices

1. **Always review generated SQL**: Ensure the migration matches your intent
2. **Test migrations locally first**: Before deploying to production
3. **Keep migrations small**: One logical change per migration
4. **Never edit migration files manually**: Use Prisma schema instead
5. **Commit migrations to version control**: They are part of your codebase
6. **Document breaking changes**: Add comments to migration files if needed

## Rollback Strategy

Prisma doesn't support automatic rollbacks. To rollback:

1. Create a new migration that reverses the changes
2. Or restore from a database backup

## Performance Considerations

The current schema includes indexes on:
- `users.email`: For fast user lookups during authentication
- `journal_entries.userId`: For fast retrieval of user's entries
- `journal_entries.createdAt`: For chronological sorting and range queries

These indexes optimize the most common query patterns in the application.

## Schema Versioning

Each migration is timestamped and numbered sequentially. The `migration_lock.toml` file ensures all developers use the same database provider (PostgreSQL).

Current version: 0_init (Initial schema)
