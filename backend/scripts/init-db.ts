import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function runMigrations(): Promise<void> {
  try {
    console.log('Running pending database migrations...');
    
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(process.cwd()),
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

async function verifyConnection(): Promise<void> {
  try {
    console.log('Verifying database connection...');
    await prisma.$connect();
    console.log('✓ Database connection successful');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting database initialization...');

    // Verify connection
    await verifyConnection();

    // Run migrations
    await runMigrations();

    // Verify schema is up to date
    const userCount = await prisma.user.count();
    console.log(`✓ Database schema verified (${userCount} users in database)`);

    console.log('✓ Database initialization completed successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
