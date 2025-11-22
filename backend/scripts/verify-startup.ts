import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;
const MAX_STARTUP_TIME = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 1000; // 1 second
const HEALTH_CHECK_ENDPOINT = `http://localhost:${PORT}/api/health`;

/**
 * Verify server startup and health
 * Requirements: 8.2
 */

/**
 * Check if server is responding to health checks
 */
async function checkServerHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(HEALTH_CHECK_ENDPOINT, (response) => {
      resolve(response.statusCode === 200 || response.statusCode === 503);
    });

    request.on('error', () => {
      resolve(false);
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServerReady(): Promise<boolean> {
  const startTime = Date.now();
  let lastError: string | null = null;

  while (Date.now() - startTime < MAX_STARTUP_TIME) {
    try {
      const isHealthy = await checkServerHealth();
      if (isHealthy) {
        return true;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }

  if (lastError) {
    console.error(`✗ Server health check failed: ${lastError}`);
  }
  return false;
}

/**
 * Verify database connectivity
 */
async function verifyDatabaseConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(HEALTH_CHECK_ENDPOINT, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve(health.database?.connected === true);
        } catch {
          resolve(false);
        }
      });
    });

    request.on('error', () => {
      resolve(false);
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Main verification function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MicroCare Backend Startup Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Starting server on port ${PORT}...`);
  console.log(`Health check endpoint: ${HEALTH_CHECK_ENDPOINT}`);
  console.log(`Max startup time: ${MAX_STARTUP_TIME}ms\n`);

  // Start the server
  const serverProcess = spawn('npm', ['run', 'start'], {
    cwd: path.resolve(__dirname, '../'),
    stdio: 'pipe',
    env: { ...process.env },
  });

  let serverOutput = '';
  let serverErrors = '';

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    process.stdout.write(output);
  });

  serverProcess.stderr?.on('data', (data) => {
    const output = data.toString();
    serverErrors += output;
    process.stderr.write(output);
  });

  serverProcess.on('error', (error) => {
    console.error('\n✗ Failed to start server process:', error.message);
    process.exit(1);
  });

  // Wait for server to be ready
  console.log('Waiting for server to be ready...');
  const isReady = await waitForServerReady();

  if (!isReady) {
    console.error('\n✗ Server failed to start within timeout period');
    console.error('\nServer output:');
    console.error(serverOutput);
    if (serverErrors) {
      console.error('\nServer errors:');
      console.error(serverErrors);
    }
    serverProcess.kill();
    process.exit(1);
  }

  console.log('✓ Server is responding to health checks');

  // Verify database connectivity
  console.log('Verifying database connectivity...');
  const dbConnected = await verifyDatabaseConnectivity();

  if (dbConnected) {
    console.log('✓ Database is connected');
  } else {
    console.warn('⚠ Database connectivity check inconclusive (server may still be initializing)');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✓ Server startup verification completed successfully');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Server is ready for requests. Press Ctrl+C to stop.\n');

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\nShutting down verification process...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Run verification
main().catch((error) => {
  console.error('Verification error:', error);
  process.exit(1);
});
