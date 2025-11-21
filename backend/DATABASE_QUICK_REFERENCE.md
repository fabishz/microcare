# Database Quick Reference

Quick commands and troubleshooting for common database operations.

## Common Commands

### Initialize Database (First Time Setup)
```bash
npm run db:init
```
Verifies connection, runs migrations, and validates schema.

### Seed Database with Test Data (Optional)
```bash
npm run db:seed
```
Creates test users and sample journal entries for development.

### Create New Migration
```bash
npm run db:migrate -- --name <migration_name>
```
Example:
```bash
npm run db:migrate -- --name add_user_bio
```

### Apply Pending Migrations (Production)
```bash
npm run db:migrate:deploy
```

### Check Migration Status
```bash
npx prisma migrate status
```

### View Database in Prisma Studio
```bash
npm run db:studio
```
Opens visual database editor at `http://localhost:5555`

### Reset Development Database (WARNING: Deletes All Data)
```bash
npx prisma migrate reset
```

## Environment Setup

### Create .env.local
```bash
cp .env.example .env.local
```

### Minimal .env.local for Development
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/microcare_dev
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### "Error: connect ECONNREFUSED"
PostgreSQL is not running.

**Solution**:
```bash
# macOS
brew services start postgresql@15

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows
# Start PostgreSQL from Services or use pgAdmin
```

### "Error: password authentication failed"
Wrong database credentials.

**Solution**:
1. Verify DATABASE_URL in .env.local
2. Check PostgreSQL user exists: `psql -U postgres -l`
3. Reset password if needed

### "Error: database does not exist"
Database hasn't been created yet.

**Solution**:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE microcare_dev;"
```

### "Error: relation does not exist"
Migrations haven't been run.

**Solution**:
```bash
npm run db:init
```

### "Error: Unique constraint failed"
Trying to create duplicate record (e.g., duplicate email).

**Solution**:
- Check if record already exists
- Use different email/unique value
- Reset database if needed: `npx prisma migrate reset`

## Development Workflow

1. **Start PostgreSQL**
   ```bash
   brew services start postgresql@15  # macOS
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL
   ```

3. **Initialize database**
   ```bash
   npm run db:init
   ```

4. **Seed test data (optional)**
   ```bash
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **View database (optional)**
   ```bash
   npm run db:studio
   ```

## Test Credentials (After Seeding)

```
User 1:
  Email: alice@example.com
  Password: password123

User 2:
  Email: bob@example.com
  Password: password456
```

## Database Schema Quick View

### Users Table
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User's full name
- `passwordHash` - Bcrypt hashed password
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Journal Entries Table
- `id` - Unique identifier
- `userId` - Reference to user
- `title` - Entry title
- `content` - Entry content
- `mood` - Optional mood indicator
- `tags` - Array of tags
- `createdAt` - Entry creation timestamp
- `updatedAt` - Last update timestamp

## Performance Tips

1. **Use indexes** - Already configured on userId and createdAt
2. **Paginate queries** - Use LIMIT and OFFSET for large datasets
3. **Connection pooling** - Use pgBouncer for production
4. **Monitor slow queries** - Enable query logging in PostgreSQL

## Backup Commands

### Backup Database
```bash
pg_dump postgresql://user:password@localhost:5432/microcare_dev > backup.sql
```

### Restore Database
```bash
psql postgresql://user:password@localhost:5432/microcare_dev < backup.sql
```

## Production Checklist

- [ ] Database URL configured with production credentials
- [ ] JWT_SECRET set to strong random value
- [ ] HTTPS_ONLY enabled
- [ ] CORS whitelist updated with production domain
- [ ] Database backups enabled
- [ ] Connection pooling configured
- [ ] Monitoring and alerting set up
- [ ] Migrations tested in staging first
- [ ] Rollback plan documented

## Additional Resources

- [Full Database Setup Guide](./DATABASE_SETUP.md)
- [Migrations Guide](./prisma/MIGRATIONS.md)
- [Schema Documentation](./prisma/SCHEMA_DOCUMENTATION.md)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
