import { PrismaClient } from '@prisma/client';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

let prisma: PrismaClient | null = null;

/**
 * Get or create a Prisma client instance with connection pooling
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }
  return prisma;
}

/**
 * Connect to the database with retry logic
 */
export async function connectDatabase(retryCount = 0): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `✗ Database connection failed. Retrying in ${RETRY_DELAY_MS}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retryCount + 1);
    } else {
      console.error('✗ Failed to connect to database after maximum retries');
      throw new Error(
        `Database connection failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('✓ Database disconnected');
  }
}

/**
 * Health check for database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Detailed health check with response time metrics
 */
export async function getDetailedHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    responseTime: number;
  };
  uptime: number;
  timestamp: string;
}> {
  const startTime = Date.now();
  const dbConnected = await checkDatabaseHealth();
  const responseTime = Date.now() - startTime;
  const uptime = process.uptime();

  return {
    status: dbConnected ? 'healthy' : 'degraded',
    database: {
      connected: dbConnected,
      responseTime,
    },
    uptime,
    timestamp: new Date().toISOString(),
  };
}
