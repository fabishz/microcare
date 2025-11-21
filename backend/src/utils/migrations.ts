import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run pending database migrations automatically
 * Requirements: 6.1, 6.4
 */
export async function runPendingMigrations(): Promise<void> {
  try {
    console.log('Checking for pending database migrations...');

    // Run Prisma migrations in deploy mode (non-interactive)
    // This applies all pending migrations without prompting
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../../'),
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Database migration failed:', errorMessage);
    throw new Error(`Migration failed: ${errorMessage}`);
  }
}

/**
 * Check if there are pending migrations
 * Returns true if migrations are pending, false otherwise
 */
export async function hasPendingMigrations(): Promise<boolean> {
  try {
    const output = execSync('npx prisma migrate status', {
      cwd: path.resolve(__dirname, '../../'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Check if output indicates pending migrations
    return output.includes('pending') || output.includes('Pending');
  } catch (error) {
    // If the command fails, assume there might be pending migrations
    console.warn('Could not check migration status:', error instanceof Error ? error.message : String(error));
    return true;
  }
}

/**
 * Get migration status information
 * Returns a string with the current migration status
 */
export async function getMigrationStatus(): Promise<string> {
  try {
    const output = execSync('npx prisma migrate status', {
      cwd: path.resolve(__dirname, '../../'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error retrieving migration status: ${errorMessage}`;
  }
}
