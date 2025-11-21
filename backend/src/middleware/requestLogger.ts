import { Request, Response, NextFunction } from 'express';

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

    // Log request details
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const queryString = Object.keys(query).length > 0 ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : '';
    
    console.log(
      `[${new Date().toISOString()}] ${logLevel.toUpperCase()} ${method} ${path}${queryString} - ${statusCode} (${duration}ms)`
    );

    // Call the original end method
    return originalEnd(...args);
  };

  next();
}
