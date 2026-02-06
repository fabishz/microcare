import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs incoming HTTP requests with method, path, and response status
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, path, query } = req;

  // Capture the original res.end to log response details
  const originalEnd = res.end.bind(res);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (...args: any[]): any {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Determine log level
    const logData = {
      method,
      path,
      query,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      logger.error(`Request failed: ${method} ${path}`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`Request warning: ${method} ${path}`, logData);
    } else {
      logger.info(`${method} ${path} - ${statusCode}`, logData);
    }

    // Call the original end method
    return originalEnd(...args);
  };

  next();
}
