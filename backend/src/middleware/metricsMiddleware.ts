/**
 * Metrics Collection Middleware
 * 
 * This middleware collects metrics for each request including response time and success/failure status.
 * It integrates with the metrics collector to track application performance.
 * 
 * Requirements: 8.1, 8.5
 */

import { Request, Response, NextFunction } from 'express';
import { metricsCollector } from '../utils/metrics.js';

/**
 * Middleware to collect request metrics
 */
export function metricsMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capture the original send method
  const originalSend = res.send.bind(res);

  // Override the send method to capture response
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 400;

    // Record metrics
    metricsCollector.recordRequest(responseTime, success);

    // Call the original send method
    return originalSend(data);
  };

  next();
}
