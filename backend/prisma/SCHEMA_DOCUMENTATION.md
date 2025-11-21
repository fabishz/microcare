# Prisma Schema Documentation

This document provides comprehensive documentation of the MicroCare database schema, including design decisions, constraints, and optimization strategies.

## Schema Overview

The MicroCare database consists of two main entities:
1. **Users** - Application users with authentication credentials
2. **JournalEntry** - Journal entries created by users

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                 │ CUID                               │
│ email (UNIQUE)          │ VARCHAR(255)                       │
│ name                    │ VARCHAR(255)                       │
│ passwordHash            │ VARCHAR(255)                       │
│ createdAt               │ TIMESTAMP DEFAULT NOW()            │
│ updatedAt               │ TIMESTAMP                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          │
┌─────────────────────────────────────────────────────────────┐
│                    JournalEntry                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                 │ CUID                               │
│ userId (FK)             │ TEXT (CASCADE DELETE)              │
│ title                   │ VARCHAR(255)                       │
│ content                 │ TEXT                               │
│ mood                    │ VARCHAR(50) NULLABLE               │
│ tags                    │ TEXT[] DEFAULT []                  │
│ createdAt               │ TIMESTAMP DEFAULT NOW()            │
│ updatedAt               │ TIMESTAMP                          │
└─────────────────────────────────────────────────────────────┘
```

## Table Specifications

### Users Table

**Purpose**: Store user account information and authentication credentials

**Columns**:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | TEXT | PRIMARY KEY, CUID | Unique user identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User email for login and contact |
| `name` | TEXT | NOT NULL | User's display name |
| `passwordHash` | TEXT | NOT NULL | Bcrypt-hashed password (never store plain text) |
| `createdAt` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Account creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Last profile update timestamp |

**Indexes**:
- `users_pkey`: Primary key on `id`
- `users_email_key`: Unique index on `email` for fast authentication lookups

**Constraints**:
- Email must be unique (prevents duplicate accounts)
- All fields except `mood` are required
- Password must be hashed before storage

**Design Decisions**:
- CUID for `id`: Provides better distribution than sequential IDs, works well in distributed systems
- Email as unique constraint: Enables email-based authentication
- Separate `passwordHash` field: Never store plain passwords, always hash with bcrypt
- `updatedAt` timestamp: Tracks when user profile was last modified

### JournalEntry Table

**Purpose**: Store journal entries created by users

**Columns**:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | TEXT | PRIMARY KEY, CUID | Unique entry identifier |
| `userId` | TEXT | FOREIGN KEY, NOT NULL | Reference to user who created entry |
| `title` | TEXT | NOT NULL | Entry title/headline |
| `content` | TEXT | NOT NULL | Full entry content |
| `mood` | TEXT | NULLABLE | Optional mood indicator (e.g., "happy", "sad") |
| `tags` | TEXT[] | DEFAULT [], NOT NULL | Array of tags for categorization |
| `createdAt` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Entry creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Last edit timestamp |

**Indexes**:
- `journal_entries_pkey`: Primary key on `id`
- `journal_entries_userId_idx`: Index on `userId` for fast user entry lookups
- `journal_entries_createdAt_idx`: Index on `createdAt` for chronological queries

**Foreign Keys**:
- `journal_entries_userId_fkey`: References `users(id)` with CASCADE DELETE
  - When a user is deleted, all their entries are automatically deleted

**Constraints**:
- `userId` must reference an existing user
- `title` and `content` are required
- `mood` is optional
- `tags` defaults to empty array

**Design Decisions**:
- CASCADE DELETE on userId: Ensures data consistency when users are deleted
- Array type for tags: Allows flexible tagging without separate junction table
- Optional mood field: Supports future mood tracking features
- Separate timestamps: Tracks both creation and modification times

## Query Patterns and Optimization

### Common Queries

#### 1. User Authentication
```sql
SELECT * FROM users WHERE email = $1;
```
**Optimization**: Unique index on `email` provides O(log n) lookup

#### 2. Get User's Entries
```sql
SELECT * FROM journal_entries 
WHERE userId = $1 
ORDER BY createdAt DESC 
LIMIT $2 OFFSET $3;
```
**Optimization**: Index on `userId` and `createdAt` enables efficient pagination

#### 3. Search Entries by Date Range
```sql
SELECT * FROM journal_entries 
WHERE userId = $1 
  AND createdAt BETWEEN $2 AND $3 
ORDER BY createdAt DESC;
```
**Optimization**: Index on `createdAt` enables range queries

#### 4. Get Entry by ID
```sql
SELECT * FROM journal_entries WHERE id = $1;
```
**Optimization**: Primary key index provides O(1) lookup

### Performance Considerations

**Index Strategy**:
- `users.email`: Unique index for authentication lookups
- `journal_entries.userId`: Enables fast filtering by user
- `journal_entries.createdAt`: Enables chronological sorting and range queries

**Query Optimization**:
- Always use indexed columns in WHERE clauses
- Use LIMIT and OFFSET for pagination
- Avoid SELECT * when possible, specify needed columns
- Use EXPLAIN ANALYZE to verify query plans

**Scaling Considerations**:
- For large user bases (>1M users), consider partitioning by userId
- For high write volume, consider connection pooling
- Monitor slow queries with `pg_stat_statements`

## Data Validation

### User Validation

**Email**:
- Must be valid email format (RFC 5322)
- Must be unique across all users
- Case-insensitive comparison recommended

**Name**:
- Required, non-empty string
- Recommended max length: 255 characters
- Should allow Unicode characters

**Password**:
- Minimum 8 characters
- Should include uppercase, lowercase, numbers, special characters
- Must be hashed with bcrypt before storage
- Never log or expose in error messages

### JournalEntry Validation

**Title**:
- Required, non-empty string
- Recommended max length: 255 characters
- Should allow Unicode characters

**Content**:
- Required, non-empty string
- No maximum length (stored as TEXT)
- Should allow Unicode characters and formatting

**Mood**:
- Optional field
- Recommended values: "happy", "sad", "anxious", "calm", "neutral"
- Should be validated against allowed values

**Tags**:
- Array of strings
- Each tag should be lowercase
- Recommended max 10 tags per entry
- Each tag max 50 characters

## Constraints and Relationships

### Foreign Key Constraints

**journal_entries.userId → users.id**
- Type: Many-to-One
- Cascade: DELETE (when user deleted, entries deleted)
- Cascade: UPDATE (when user ID changes, entries updated)
- Enforced: Database level

### Unique Constraints

**users.email**
- Ensures no duplicate email addresses
- Enables email-based authentication
- Case-sensitive by default (consider case-insensitive index)

### Check Constraints (Recommended for Future)

```sql
-- Validate email format
ALTER TABLE users ADD CONSTRAINT email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Validate mood values
ALTER TABLE journal_entries ADD CONSTRAINT mood_values 
CHECK (mood IS NULL OR mood IN ('happy', 'sad', 'anxious', 'calm', 'neutral'));
```

## Data Types and Sizes

### Text Fields

| Field | Type | Max Size | Rationale |
|-------|------|----------|-----------|
| `email` | VARCHAR(255) | 255 chars | RFC 5321 limit |
| `name` | VARCHAR(255) | 255 chars | Typical name length |
| `title` | VARCHAR(255) | 255 chars | Entry headline |
| `content` | TEXT | Unlimited | Full entry content |
| `mood` | VARCHAR(50) | 50 chars | Mood indicator |

### Timestamp Fields

- `createdAt`: Immutable, set at creation
- `updatedAt`: Updated on every modification
- Precision: Milliseconds (TIMESTAMP(3))
- Timezone: UTC (recommended)

### Array Fields

- `tags`: TEXT[] array
- Default: Empty array []
- Recommended max: 10 items
- Item max length: 50 characters

## Backup and Recovery

### Backup Strategy

**Full Backup**:
```bash
pg_dump microcare > microcare_full_backup.sql
```

**Incremental Backup**:
```bash
pg_basebackup -D /backup/microcare -Ft -z
```

**Backup Frequency**:
- Development: Daily
- Staging: Daily
- Production: Hourly

### Recovery Procedures

**Full Restore**:
```bash
psql microcare < microcare_full_backup.sql
```

**Point-in-Time Recovery**:
```bash
pg_restore -d microcare microcare_backup.dump --recovery-target-time='2024-01-15 10:00:00'
```

## Monitoring and Maintenance

### Regular Maintenance

**Vacuum and Analyze**:
```sql
VACUUM ANALYZE;
```
- Reclaims disk space
- Updates table statistics
- Improves query performance
- Recommended: Weekly

**Index Maintenance**:
```sql
REINDEX TABLE users;
REINDEX TABLE journal_entries;
```
- Rebuilds indexes
- Removes bloat
- Recommended: Monthly

**Statistics Update**:
```sql
ANALYZE;
```
- Updates query planner statistics
- Recommended: After large data changes

### Monitoring Queries

**Table Sizes**:
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Index Usage**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Slow Queries**:
```sql
SELECT 
  query,
  calls,
  mean_time,
  max_time,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

## Future Schema Enhancements

### Potential Additions

1. **User Preferences**:
   - Theme preference (light/dark)
   - Notification settings
   - Privacy settings

2. **Entry Metadata**:
   - Location
   - Weather
   - Activity
   - People mentioned

3. **Social Features**:
   - Sharing settings
   - Comments
   - Likes/reactions

4. **Analytics**:
   - Mood trends
   - Entry frequency
   - Tag usage

### Migration Strategy

When adding new features:
1. Add new columns/tables to schema
2. Create migration with `npm run db:migrate`
3. Test migration on staging
4. Deploy to production
5. Update application code
6. Monitor for issues

## Schema Versioning

**Current Version**: 1.0.0
**Last Updated**: Initial deployment
**Database Provider**: PostgreSQL 12+
**Prisma Version**: 5.8.0+

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial schema with users and journal_entries tables |

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://en.wikipedia.org/wiki/Database_design)
