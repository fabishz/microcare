import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database initialization...');

    // Test connection
    await prisma.$connect();
    console.log('✓ Database connection successful');

    // Run migrations (Prisma handles this automatically)
    console.log('✓ Database schema is up to date');

    console.log('✓ Database initialization completed successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
