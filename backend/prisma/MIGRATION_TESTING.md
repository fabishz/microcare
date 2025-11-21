# Migration Testing and Rollback Guide

This document provides procedures for testing migrations and verifying rollback capability for the MicroCare backend.

## Testing Migrations Locally

### Prerequisites
- PostgreSQL running locally
- `.env.local` configured with local database URL
- All dependencies installed (`npm install`)

### Test Procedure

#### 1. Create a Test Database
```bash
# Create a fresh test database
createdb microcare_test

# Update .env.local to point to test database
DATABASE_URL="postgresql://postgres:password@localhost:5432/microcare_test"
```

#### 2. Apply Migrations
```bash
# Apply all migrations to test database
npm run db:migrate:deploy

# Verify migration status
npx prisma migrate status
```

#### 3. Verify Schema
```bash
# Open Prisma Studio to inspect schema
npm run db:studio

# Or query the database directly
psql microcare_test -c "\dt"  # List tables
psql microcare_test -c "\di"  # List indexes
```

#### 4. Test Data Operations
```bash
# Create test data
npm run db:studio

# Or use Prisma client to test
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password'
    }
  });
  console.log('Created user:', user);
  await prisma.\$disconnect();
})();
"
```

## Testing Migration Rollback

### Rollback Testing Procedure

#### 1. Backup Current Database
```bash
# Create backup before testing rollback
pg_dump microcare_test > microcare_test_backup.sql
```

#### 2. Identify Migration to Rollback
```bash
# Check migration history
npx prisma migrate status

# List all migrations
ls -la prisma/migrations/
```

#### 3. Restore from Backup
```bash
# Drop test database
dropdb microcare_test

# Restore from backup
createdb microcare_test
psql microcare_test < microcare_test_backup.sql

# Verify restoration
npx prisma migrate status
```

#### 4. Create Reverse Migration (if needed)
```bash
# If you need to reverse a schema change, create a new migration
npm run db:migrate -- --name revert_previous_change

# Edit the generated migration file to reverse the changes
# Then apply it
npm run db:migrate:deploy
```

## Production Migration Testing

### Pre-Production Testing Checklist

- [ ] Test migration on staging database with production-like data volume
- [ ] Verify migration time is acceptable (< 5 minutes for large tables)
- [ ] Test with realistic data patterns
- [ ] Verify no data loss or corruption
- [ ] Check index creation performance
- [ ] Verify foreign key constraints
- [ ] Test application functionality post-migration
- [ ] Monitor database performance during migration
- [ ] Verify backup and restore procedures work

### Staging Environment Test

```bash
# 1. Backup staging database
pg_dump staging_db > staging_backup.sql

# 2. Apply migrations to staging
npm run db:migrate:deploy

# 3. Run integration tests
npm test

# 4. Verify data integrity
npm run db:studio

# 5. If issues found, restore from backup
psql staging_db < staging_backup.sql
```

## Zero-Downtime Migration Strategy

For large tables or long-running migrations:

### 1. Expand Phase
- Add new column/table without removing old one
- Deploy code that writes to both old and new locations
- Backfill data in background

### 2. Migrate Phase
- Copy remaining data
- Verify data consistency
- Update application to read from new location

### 3. Contract Phase
- Remove old column/table
- Deploy code that only uses new location
- Monitor for issues

### Example: Adding a Column
```sql
-- Migration 1: Add new column
ALTER TABLE users ADD COLUMN bio TEXT;

-- Migration 2: Backfill data (if needed)
UPDATE users SET bio = '' WHERE bio IS NULL;

-- Migration 3: Remove old column (if replacing)
ALTER TABLE users DROP COLUMN old_field;
```

## Monitoring Migrations

### During Migration
```bash
# Monitor migration progress
watch -n 1 'psql microcare -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"'

# Monitor database size
watch -n 1 'psql microcare -c "SELECT pg_size_pretty(pg_database_size(current_database()));"'

# Monitor active connections
watch -n 1 'psql microcare -c "SELECT count(*) FROM pg_stat_activity;"'
```

### Post-Migration Verification
```bash
# Verify all migrations applied
npx prisma migrate status

# Check for migration errors
psql microcare -c "SELECT * FROM _prisma_migrations WHERE execution_failure_reason IS NOT NULL;"

# Verify schema matches Prisma schema
npx prisma db push --skip-generate --dry-run
```

## Common Issues and Solutions

### Issue: Migration Hangs
**Symptoms**: Migration takes longer than expected
**Solution**:
1. Check for long-running queries: `SELECT * FROM pg_stat_activity;`
2. Kill blocking queries if safe: `SELECT pg_terminate_backend(pid);`
3. Check table locks: `SELECT * FROM pg_locks;`
4. Consider running migration during maintenance window

### Issue: Migration Fails with Constraint Error
**Symptoms**: Foreign key or unique constraint violation
**Solution**:
1. Identify conflicting data: `SELECT * FROM table WHERE condition;`
2. Clean up data or adjust migration
3. Create new migration to fix data
4. Reapply migrations

### Issue: Out of Disk Space
**Symptoms**: Migration fails with "no space left on device"
**Solution**:
1. Check disk usage: `df -h`
2. Free up space or add more storage
3. Retry migration

### Issue: Connection Pool Exhausted
**Symptoms**: "too many connections" error
**Solution**:
1. Reduce connection pool size during migration
2. Close idle connections
3. Increase max_connections in PostgreSQL config

## Rollback Procedures

### Scenario 1: Migration Not Yet Applied to Production
```bash
# Simply don't deploy the migration
# Keep it in version control for later
```

### Scenario 2: Migration Applied, Need to Rollback
```bash
# Option A: Restore from backup (recommended)
pg_restore -d microcare microcare_backup.dump

# Option B: Create reverse migration
npm run db:migrate -- --name revert_migration_name
# Edit migration to reverse changes
npm run db:migrate:deploy
```

### Scenario 3: Partial Migration Failure
```bash
# Check migration status
npx prisma migrate status

# View failed migration details
psql microcare -c "SELECT * FROM _prisma_migrations WHERE execution_failure_reason IS NOT NULL;"

# Resolve issue and retry
npm run db:migrate:deploy
```

## Documentation and Tracking

### Migration Checklist Template
```markdown
## Migration: [Name]
- [ ] Schema changes reviewed
- [ ] SQL reviewed for correctness
- [ ] Tested on development database
- [ ] Tested on staging database
- [ ] Data integrity verified
- [ ] Performance impact assessed
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Deployed to production
- [ ] Post-deployment verification completed
```

### Migration Log
Keep a log of all migrations applied to production:
```
Date: 2024-01-15
Migration: 0_init
Status: Applied
Duration: 2 seconds
Notes: Initial schema creation
```

## Best Practices Summary

1. **Always test migrations locally first**
2. **Review generated SQL before applying**
3. **Backup database before production migrations**
4. **Have a documented rollback plan**
5. **Monitor migration progress**
6. **Verify data integrity post-migration**
7. **Document all migrations**
8. **Use version control for migration files**
9. **Test with realistic data volumes**
10. **Plan for zero-downtime if needed**
