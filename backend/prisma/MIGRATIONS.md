# Database Migrations Guide

This document describes the database migration system for MicroCare backend using Prisma.

## Overview

Prisma handles database migrations automatically. Each migration is stored in the `prisma/migrations` directory with a timestamp and descriptive name. Migrations are version-controlled and applied sequentially to ensure database schema consistency across all environments.

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
This command applies all pending migrations without prompting. Use this in CI/CD pipelines and production deployments.

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio to view and edit data in the database.

### Check Migration Status
```bash
npx prisma migrate status
```
Shows which migrations have been applied and which are pending.

## Creating New Migrations

When you modify `prisma/schema.prisma`:

1. Update the schema file with your changes
2. Run `npm run db:migrate -- --name <migration_name>`
3. Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
4. Test the migration locally with real data
5. Commit the migration files to version control

Example:
```bash
npm run db:migrate -- --name add_user_bio
```

## Migration Best Practices

1. **Always review generated SQL**: Ensure the migration matches your intent before applying
2. **Test migrations locally first**: Before deploying to production with real data
3. **Keep migrations small**: One logical change per migration for easier debugging
4. **Never edit migration files manually**: Use Prisma schema instead and regenerate
5. **Commit migrations to version control**: They are part of your codebase and deployment
6. **Document breaking changes**: Add comments to migration files if needed
7. **Test rollback capability**: Verify you can restore from backups if needed
8. **Use descriptive names**: Make migration names clear about what they do

## Rollback Strategy

Prisma doesn't support automatic rollbacks. To rollback a migration:

### Option 1: Restore from Database Backup
```bash
# Restore database from backup
# Then verify schema matches current migrations
npx prisma migrate status
```

### Option 2: Create Reverse Migration
1. Identify the migration to reverse
2. Create a new migration that undoes the changes
3. Apply the new migration

Example:
```bash
# If you added a column, create a migration to remove it
npm run db:migrate -- --name remove_user_bio
```

### Option 3: Reset Development Database
```bash
# WARNING: This deletes all data in development
npx prisma migrate reset
```

## Production Deployment Process

### Pre-Deployment Checklist
- [ ] All migrations tested locally with realistic data
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Migration scripts reviewed by team
- [ ] Zero-downtime migration strategy confirmed (if needed)

### Deployment Steps
1. Deploy new backend code with updated schema
2. Run migrations: `npm run db:migrate:deploy`
3. Verify migration success: `npx prisma migrate status`
4. Monitor application logs for errors
5. Verify data integrity post-migration

### Monitoring Post-Deployment
- Check application logs for database errors
- Verify API endpoints are functioning
- Monitor database performance
- Check for any data inconsistencies

## Performance Considerations

The current schema includes indexes on:
- `users.email`: For fast user lookups during authentication
- `journal_entries.userId`: For fast retrieval of user's entries
- `journal_entries.createdAt`: For chronological sorting and range queries

These indexes optimize the most common query patterns in the application.

### Index Strategy
- Indexes on foreign keys improve JOIN performance
- Indexes on frequently filtered columns improve query speed
- Avoid over-indexing as it slows down writes
- Monitor query performance in production

## Schema Versioning

Each migration is timestamped and numbered sequentially. The `migration_lock.toml` file ensures all developers use the same database provider (PostgreSQL).

### Current Schema Version
- **Version**: 0_init (Initial schema)
- **Status**: Production-ready
- **Last Updated**: Initial deployment
- **Database Provider**: PostgreSQL

## Troubleshooting

### Migration Fails to Apply
```bash
# Check migration status
npx prisma migrate status

# View detailed error
npx prisma migrate deploy --verbose
```

### Schema Out of Sync
```bash
# Verify schema matches database
npx prisma db push --skip-generate

# If needed, reset and reapply
npx prisma migrate reset
```

### Connection Issues
- Verify DATABASE_URL environment variable is set correctly
- Check database server is running and accessible
- Verify credentials have proper permissions
- Check network connectivity to database

## Environment-Specific Configuration

### Development
- Use local PostgreSQL instance
- Run migrations with `npm run db:migrate`
- Safe to reset database with `npx prisma migrate reset`

### Staging
- Use staging database with production-like data
- Run migrations with `npm run db:migrate:deploy`
- Test with realistic data volumes
- Verify performance before production

### Production
- Use managed database service (RDS, Cloud SQL, etc.)
- Run migrations with `npm run db:migrate:deploy` in CI/CD
- Always backup before migrations
- Monitor closely post-deployment
- Have rollback plan ready
