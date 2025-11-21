import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Verify database connection
 * Requirements: 6.3, 6.4
 */
async function verifyConnection(): Promise<void> {
  try {
    console.log('Verifying database connection...');
    await prisma.$connect();
    console.log('✓ Database connection successful');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Database connection failed:', errorMessage);
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.error('\nTroubleshooting:');
      console.error('1. Ensure PostgreSQL is running');
      console.error('2. Verify DATABASE_URL environment variable is correct');
      console.error('3. Check database credentials and permissions');
    }
    
    throw error;
  }
}

/**
 * Run pending database migrations
 * Requirements: 6.1, 6.3
 */
async function runMigrations(): Promise<void> {
  try {
    console.log('Running pending database migrations...');
    
    // Run Prisma migrations in deploy mode (non-interactive)
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../'),
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Migration failed:', errorMessage);
    throw error;
  }
}

/**
 * Verify database schema is up to date
 * Requirements: 6.3
 */
async function verifySchema(): Promise<void> {
  try {
    console.log('Verifying database schema...');
    
    // Check if tables exist and are accessible
    const userCount = await prisma.user.count();
    const entryCount = await prisma.journalEntry.count();
    
    console.log(`✓ Database schema verified`);
    console.log(`  - Users table: ${userCount} records`);
    console.log(`  - Journal entries table: ${entryCount} records`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Schema verification failed:', errorMessage);
    throw error;
  }
}

/**
 * Display database information
 */
async function displayDatabaseInfo(): Promise<void> {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'Not configured';
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    console.log('\nDatabase Information:');
    console.log(`  - Environment: ${nodeEnv}`);
    console.log(`  - Database URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
  } catch (error) {
    // Silently fail for info display
  }
}

/**
 * Main initialization function
 * Requirements: 6.1, 6.3, 6.4
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  MicroCare Database Initialization');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Display database info
    await displayDatabaseInfo();
    console.log();

    // Verify connection
    await verifyConnection();
    console.log();

    // Run migrations
    await runMigrations();
    console.log();

    // Verify schema
    await verifySchema();
    console.log();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ Database initialization completed successfully');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('✗ Database initialization failed');
    console.error('═══════════════════════════════════════════════════════════\n');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    
    console.error('\nNext steps:');
    console.error('1. Check your DATABASE_URL environment variable');
    console.error('2. Ensure PostgreSQL is running and accessible');
    console.error('3. Verify database credentials and permissions');
    console.error('4. Review the DATABASE_SETUP.md guide for more information\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
main();
