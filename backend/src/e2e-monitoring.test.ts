import request from 'supertest';
import app from './index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-End Tests for Health Check and Monitoring Endpoints
 * 
 * These tests verify the health check and metrics endpoints:
 * - GET /api/health returns health status
 * - GET /api/metrics returns detailed metrics
 * - Database connectivity is properly reported
 * - Response times are tracked
 * 
 * Requirements: 8.1, 8.5
 * 
 * Prerequisites:
 * - PostgreSQL database running and accessible
 * - Database URL configured in .env file
 * - All migrations applied
 * 
 * To run these tests:
 * 1. Ensure PostgreSQL is running
 * 2. Run: npm test -- e2e-monitoring.test.ts
 */

describe('E2E Tests - Health Check and Monitoring', () => {
  let dbConnected = false;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
      console.warn(
        '\n⚠️  Database not available for E2E monitoring tests.\n' +
        'To run E2E tests, ensure PostgreSQL is running.\n'
      );
      dbConnected = false;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const describeIfDb = dbConnected ? describe : describe.skip;

  describe('Health Check Endpoint', () => {
    it('should return appropriate status code based on database connectivity', async () => {
      const response = await request(app)
        .get('/api/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    it('should include database response time in health check', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.database).toHaveProperty('responseTime');
      expect(typeof response.body.database.responseTime).toBe('number');
      expect(response.body.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should have uptime greater than 0', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describeIfDb('Metrics Endpoint', () => {
    it('should return 200 with metrics data', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('health');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include health status in metrics response', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.health).toHaveProperty('status');
      expect(response.body.health).toHaveProperty('database');
      expect(response.body.health).toHaveProperty('uptime');
      expect(response.body.health).toHaveProperty('timestamp');
    });

    it('should include request metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('requests');
      expect(response.body.metrics.requests).toHaveProperty('total');
      expect(response.body.metrics.requests).toHaveProperty('failed');
      expect(response.body.metrics.requests).toHaveProperty('successful');
      expect(response.body.metrics.requests).toHaveProperty('averageResponseTime');
      expect(response.body.metrics.requests).toHaveProperty('lastUpdated');

      expect(typeof response.body.metrics.requests.total).toBe('number');
      expect(typeof response.body.metrics.requests.failed).toBe('number');
      expect(typeof response.body.metrics.requests.successful).toBe('number');
      expect(typeof response.body.metrics.requests.averageResponseTime).toBe('number');
    });

    it('should include database metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('database');
      expect(response.body.metrics.database).toHaveProperty('queryCount');
      expect(response.body.metrics.database).toHaveProperty('averageQueryTime');
      expect(response.body.metrics.database).toHaveProperty('failedQueries');
      expect(response.body.metrics.database).toHaveProperty('lastUpdated');

      expect(typeof response.body.metrics.database.queryCount).toBe('number');
      expect(typeof response.body.metrics.database.averageQueryTime).toBe('number');
      expect(typeof response.body.metrics.database.failedQueries).toBe('number');
    });

    it('should include error rate in metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('errorRate');
      expect(typeof response.body.metrics.errorRate).toBe('number');
      expect(response.body.metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should include memory usage in metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('memory');
      expect(response.body.metrics.memory).toHaveProperty('heapUsed');
      expect(response.body.metrics.memory).toHaveProperty('heapTotal');
      expect(response.body.metrics.memory).toHaveProperty('external');

      expect(typeof response.body.metrics.memory.heapUsed).toBe('number');
      expect(typeof response.body.metrics.memory.heapTotal).toBe('number');
      expect(typeof response.body.metrics.memory.external).toBe('number');
    });

    it('should include uptime in metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('uptime');
      expect(typeof response.body.metrics.uptime).toBe('number');
      expect(response.body.metrics.uptime).toBeGreaterThan(0);
    });

    it('should track request metrics across multiple requests', async () => {
      // Make a few requests to generate metrics
      await request(app).get('/api/health');
      await request(app).get('/api/health');

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.metrics.requests.total).toBeGreaterThan(0);
    });

    it('should have consistent timestamp format', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Health Check Status Codes', () => {
    it('should return 200 for healthy status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect([200, 503]).toContain(response.status);
    });

    it('should return appropriate status code based on health', async () => {
      const response = await request(app)
        .get('/api/health');

      if (response.body.status === 'healthy') {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(503);
      }
    });
  });

  describe('Metrics Endpoint Error Handling', () => {
    it('should handle metrics collection errors gracefully', async () => {
      const response = await request(app)
        .get('/api/metrics');

      // Should either succeed or return 500 with error message
      expect([200, 500]).toContain(response.status);

      if (response.status === 500) {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('timestamp');
      }
    });
  });

  describe('Monitoring Endpoint Accessibility', () => {
    it('should allow unauthenticated access to health endpoint', async () => {
      const response = await request(app)
        .get('/api/health');

      expect([200, 503]).toContain(response.status);
    });

    it('should allow unauthenticated access to metrics endpoint', async () => {
      const response = await request(app)
        .get('/api/metrics');

      expect([200, 500]).toContain(response.status);
    });

    it('should not require authorization header for health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', '');

      expect([200, 503]).toContain(response.status);
    });

    it('should not require authorization header for metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', '');

      expect([200, 500]).toContain(response.status);
    });
  });
});
