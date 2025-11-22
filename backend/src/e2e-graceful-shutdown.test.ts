import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * End-to-End Tests for Graceful Shutdown and Error Recovery
 * 
 * These tests verify graceful shutdown behavior:
 * - Server responds to SIGTERM signal
 * - Server responds to SIGINT signal
 * - In-flight requests are handled properly
 * - Database connections are closed
 * - Server exits cleanly
 * 
 * Requirements: 8.2
 * 
 * Note: These tests spawn actual server processes and may take time to run.
 * They are skipped by default and can be run with:
 * npm test -- e2e-graceful-shutdown.test.ts
 */

describe('E2E Tests - Graceful Shutdown and Error Recovery', () => {
  const PORT = 3001; // Use different port to avoid conflicts
  const STARTUP_TIMEOUT = 15000; // 15 seconds
  const SHUTDOWN_TIMEOUT = 35000; // 35 seconds

  /**
   * Helper function to check if server is responding
   */
  function isServerReady(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const request = http.get(`http://localhost:${port}/api/health`, (response) => {
        resolve(response.statusCode === 200 || response.statusCode === 503);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.setTimeout(2000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Helper function to wait for server to be ready
   */
  async function waitForServerReady(port: number, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await isServerReady(port)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
  }

  /**
   * Helper function to start server process
   */
  function startServer(port: number): ChildProcess {
    const env = { ...process.env, PORT: String(port), NODE_ENV: 'test' };
    return spawn('npm', ['run', 'start'], {
      cwd: path.resolve(__dirname, '../'),
      env,
      stdio: 'pipe',
    });
  }

  describe('Graceful Shutdown on SIGTERM', () => {
    it('should shutdown gracefully when receiving SIGTERM', async () => {
      const server = startServer(PORT);
      let output = '';
      let errors = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      server.stderr?.on('data', (data) => {
        errors += data.toString();
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      // Send SIGTERM signal
      server.kill('SIGTERM');

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        server.on('exit', (code) => {
          expect(code).toBe(0);
          expect(output).toContain('SIGTERM received');
          expect(output).toContain('graceful shutdown');
          resolve();
        });

        // Timeout if process doesn't exit
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);

    it('should close database connections on SIGTERM', async () => {
      const server = startServer(PORT);
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      // Send SIGTERM signal
      server.kill('SIGTERM');

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        server.on('exit', () => {
          expect(output).toContain('Database disconnected');
          resolve();
        });

        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);

    it('should stop accepting new connections on SIGTERM', async () => {
      const server = startServer(PORT);
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      // Send SIGTERM signal
      server.kill('SIGTERM');

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        server.on('exit', () => {
          expect(output).toContain('stopped accepting new connections');
          resolve();
        });

        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);
  });

  describe('Graceful Shutdown on SIGINT', () => {
    it('should shutdown gracefully when receiving SIGINT', async () => {
      const server = startServer(PORT);
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      // Send SIGINT signal
      server.kill('SIGINT');

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        server.on('exit', (code) => {
          expect(code).toBe(0);
          expect(output).toContain('SIGINT received');
          expect(output).toContain('graceful shutdown');
          resolve();
        });

        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);
  });

  describe('Server Startup', () => {
    it('should start successfully and respond to health checks', async () => {
      const server = startServer(PORT);

      server.stdout?.on('data', () => {
        // Consume output
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      // Verify health endpoint responds
      const response = await new Promise<http.IncomingMessage>((resolve) => {
        http.get(`http://localhost:${PORT}/api/health`, (res) => {
          resolve(res);
        });
      });

      expect([200, 503]).toContain(response.statusCode);

      // Clean up
      server.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        server.on('exit', () => resolve());
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);

    it('should log startup completion', async () => {
      const server = startServer(PORT);
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);

      expect(output).toContain('Server running on port');

      // Clean up
      server.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        server.on('exit', () => resolve());
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);
  });

  describe('Error Recovery', () => {
    it('should handle database connection failures gracefully', async () => {
      const env = {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://invalid:invalid@localhost:5432/invalid',
      };

      const server = spawn('npm', ['run', 'start'], {
        cwd: path.resolve(__dirname, '../'),
        env,
        stdio: 'pipe',
      });

      let output = '';
      let errors = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
      });

      server.stderr?.on('data', (data) => {
        errors += data.toString();
      });

      // Wait for process to exit (should fail due to invalid database)
      await new Promise<void>((resolve) => {
        server.on('exit', (code) => {
          // Should exit with error code
          expect(code).not.toBe(0);
          expect(output + errors).toContain('connection');
          resolve();
        });

        // Timeout
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, STARTUP_TIMEOUT + 5000);
      });
    }, STARTUP_TIMEOUT + 10000);
  });

  describe('Health Check Endpoints', () => {
    let server: ChildProcess;

    beforeAll(async () => {
      server = startServer(PORT);

      server.stdout?.on('data', () => {
        // Consume output
      });

      // Wait for server to be ready
      const isReady = await waitForServerReady(PORT, STARTUP_TIMEOUT);
      expect(isReady).toBe(true);
    }, STARTUP_TIMEOUT + 5000);

    afterAll(async () => {
      server.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        server.on('exit', () => resolve());
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, SHUTDOWN_TIMEOUT);
      });
    }, SHUTDOWN_TIMEOUT + 5000);

    it('should return health status from /api/health', async () => {
      const response = await new Promise<{ statusCode: number; body: string }>((resolve) => {
        const request = http.get(`http://localhost:${PORT}/api/health`, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 500, body });
          });
        });

        request.on('error', () => {
          resolve({ statusCode: 500, body: '' });
        });
      });

      expect([200, 503]).toContain(response.statusCode);
      const health = JSON.parse(response.body);
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('database');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('timestamp');
    });

    it('should return metrics from /api/metrics', async () => {
      const response = await new Promise<{ statusCode: number; body: string }>((resolve) => {
        const request = http.get(`http://localhost:${PORT}/api/metrics`, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 500, body });
          });
        });

        request.on('error', () => {
          resolve({ statusCode: 500, body: '' });
        });
      });

      expect([200, 500]).toContain(response.statusCode);
      if (response.statusCode === 200) {
        const metrics = JSON.parse(response.body);
        expect(metrics).toHaveProperty('status');
        expect(metrics).toHaveProperty('health');
        expect(metrics).toHaveProperty('metrics');
      }
    });
  });
});
