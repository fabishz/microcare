# Production Deployment Guide

This guide provides step-by-step instructions for deploying MicroCare backend to production, including database migration procedures.

## Pre-Deployment Checklist

### Code Review
- [ ] All code changes reviewed and approved
- [ ] Tests passing locally
- [ ] No console.log statements in production code
- [ ] Environment variables documented
- [ ] Security review completed

### Database
- [ ] All migrations tested on staging
- [ ] Database backup strategy in place
- [ ] Rollback plan documented
- [ ] Schema changes reviewed
- [ ] Performance impact assessed

### Infrastructure
- [ ] SSL/TLS certificates configured
- [ ] CORS whitelist updated
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Logging configured

### Documentation
- [ ] Deployment steps documented
- [ ] Rollback procedures documented
- [ ] Environment variables documented
- [ ] Team notified of deployment

## Environment Setup

### 1. Production Environment Variables

Create `.env.production` with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/microcare
DATABASE_URL_UNPOOLED=postgresql://[user]:[password]@[host]:[port]/microcare

# JWT Configuration
JWT_SECRET=[generate-strong-random-secret]
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Encryption (Base64-encoded 32-byte key)
ENCRYPTION_KEY=[generate-strong-random-base64-key]

# CORS Configuration
FRONTEND_URL=https://microcare.example.com

# Logging
LOG_LEVEL=info

# Redis (Background Jobs)
REDIS_URL=redis://[host]:6379
```

### 2. Database Setup

```bash
# Create production database
createdb microcare

# Set proper permissions
psql microcare -c "GRANT CONNECT ON DATABASE microcare TO [app_user];"
psql microcare -c "GRANT USAGE ON SCHEMA public TO [app_user];"
psql microcare -c "GRANT CREATE ON SCHEMA public TO [app_user];"
```

## Deployment Steps

### Step 1: Backup Current Database

```bash
# Create backup before deployment
pg_dump microcare > microcare_backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list microcare_backup_*.dump | head -20
```

### Step 2: Deploy New Code

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### Step 3: Run Database Migrations

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npm run db:migrate:deploy

# Verify migrations applied
npx prisma migrate status
```

If enabling app-level encryption on an existing database, run:

```bash
npm run db:reencrypt
```

### Step 4: Start Application

```bash
# Start the application
npm start

# Start background worker
npm run worker

# Verify application is running
curl http://localhost:3000/api/health

# Check logs for errors
tail -f logs/app.log
```

### Step 5: Verify Deployment

```bash
# Test API endpoints
curl -X POST https://microcare.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check database connectivity
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const count = await prisma.user.count();
  console.log('Users in database:', count);
  await prisma.\$disconnect();
})();
"

# Monitor application logs
tail -f logs/app.log
```

## Rollback Procedures

### If Deployment Fails

#### Option 1: Restore from Backup (Recommended)

```bash
# Stop application
pm2 stop microcare

# Restore database from backup
pg_restore -d microcare microcare_backup_*.dump

# Revert code to previous version
git checkout HEAD~1

# Rebuild and restart
npm install --production
npm run build
npm start
```

#### Option 2: Revert Migrations Only

```bash
# If only migrations need to be reverted
pg_restore -d microcare microcare_backup_*.dump

# Verify migrations reverted
npx prisma migrate status
```

#### Option 3: Create Reverse Migration

```bash
# If you need to keep the code but revert schema changes
npm run db:migrate -- --name revert_last_migration

# Edit the generated migration to reverse changes
# Then apply it
npm run db:migrate:deploy
```

## Post-Deployment Verification

### 1. Application Health

```bash
# Check health endpoint
curl https://microcare.example.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T10:30:00Z",
#   "database": "connected"
# }
```

### 2. Database Integrity

```bash
# Verify tables exist
psql microcare -c "\dt"

# Verify indexes
psql microcare -c "\di"

# Check for any errors in migrations
psql microcare -c "SELECT * FROM _prisma_migrations WHERE execution_failure_reason IS NOT NULL;"
```

### 3. API Functionality

```bash
# Test authentication
curl -X POST https://microcare.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test user profile
curl -X GET https://microcare.example.com/api/v1/users/profile \
  -H "Authorization: Bearer [token]"

# Test entries
curl -X GET https://microcare.example.com/api/v1/entries \
  -H "Authorization: Bearer [token]"
```

### 4. Monitoring

```bash
# Monitor application logs
tail -f logs/app.log

# Monitor database performance
psql microcare -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor server resources
top
df -h
```

## Monitoring and Maintenance

### Daily Checks

```bash
# Check application status
pm2 status

# Check error logs
grep ERROR logs/app.log | tail -20

# Check database size
psql microcare -c "SELECT pg_size_pretty(pg_database_size('microcare'));"
```

### Weekly Maintenance

```bash
# Analyze query performance
psql microcare -c "ANALYZE;"

# Vacuum database
psql microcare -c "VACUUM ANALYZE;"

# Check for unused indexes
psql microcare -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"
```

### Monthly Tasks

```bash
# Backup database
pg_dump microcare > microcare_backup_$(date +%Y%m%d).dump

# Archive old logs
gzip logs/app.log.*

# Review and optimize slow queries
psql microcare -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 20;"
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
tail -f logs/app.log

# Verify environment variables
env | grep NODE_ENV
env | grep DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check port availability
lsof -i :3000
```

### Database Migration Fails

```bash
# Check migration status
npx prisma migrate status

# View failed migration
psql microcare -c "SELECT * FROM _prisma_migrations WHERE execution_failure_reason IS NOT NULL;"

# Restore from backup and retry
pg_restore -d microcare microcare_backup_*.dump
npm run db:migrate:deploy
```

### High Database Load

```bash
# Check active connections
psql microcare -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
psql microcare -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Increase connection pool size if needed
# Update DATABASE_URL with pool parameters
```

## Disaster Recovery

### Complete System Failure

```bash
# 1. Restore database from backup
pg_restore -d microcare microcare_backup_*.dump

# 2. Verify database integrity
psql microcare -c "SELECT COUNT(*) FROM users;"
psql microcare -c "SELECT COUNT(*) FROM journal_entries;"

# 3. Redeploy application
git pull origin main
npm install --production
npm run build
npm start

# 4. Verify all systems operational
curl https://microcare.example.com/api/health
```

### Data Corruption

```bash
# 1. Stop application
pm2 stop microcare

# 2. Restore from backup
pg_restore -d microcare microcare_backup_*.dump

# 3. Verify data integrity
psql microcare -c "SELECT * FROM users LIMIT 5;"

# 4. Restart application
npm start
```

## Performance Optimization

### Database Optimization

```bash
# Create missing indexes
psql microcare -c "CREATE INDEX idx_users_email ON users(email);"

# Analyze query plans
psql microcare -c "EXPLAIN ANALYZE SELECT * FROM journal_entries WHERE userId = 'user-id';"

# Vacuum and analyze
psql microcare -c "VACUUM ANALYZE;"
```

### Application Optimization

```bash
# Enable compression
# Configure in nginx or application

# Enable caching
# Configure Redis or in-memory cache

# Optimize database queries
# Review slow query logs
# Add indexes as needed
```

## Security Hardening

### SSL/TLS Configuration

```bash
# Verify SSL certificate
openssl s_client -connect microcare.example.com:443

# Check certificate expiration
openssl x509 -in /path/to/cert.pem -noout -dates
```

### Security Headers

```bash
# Verify security headers
curl -I https://microcare.example.com/api/health

# Should include:
# Strict-Transport-Security
# X-Content-Type-Options
# X-Frame-Options
# Content-Security-Policy
```

### Rate Limiting

```bash
# Verify rate limiting is active
# Test with multiple requests
for i in {1..100}; do
  curl https://microcare.example.com/api/v1/auth/login
done

# Should receive 429 Too Many Requests after limit
```

## Rollback Decision Tree

```
Deployment Issue?
├─ Application won't start
│  └─ Revert code to previous version
├─ Database migration fails
│  └─ Restore database from backup
├─ API endpoints not working
│  └─ Check logs and verify environment variables
├─ Data corruption detected
│  └─ Restore database from backup
└─ Performance degradation
   └─ Check database queries and optimize
```

## Contact and Escalation

- **On-Call Engineer**: [contact info]
- **Database Administrator**: [contact info]
- **DevOps Team**: [contact info]
- **Emergency Hotline**: [phone number]

## Deployment Log Template

```
Date: 2024-01-15
Time: 10:00 UTC
Deployed By: [name]
Version: [git commit hash]
Changes: [summary of changes]
Migrations: [list of migrations applied]
Status: ✓ Successful
Issues: None
Verified By: [name]
```
