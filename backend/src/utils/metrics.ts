/**
 * Metrics Collection Utility
 * 
 * This utility collects and manages application metrics for monitoring and observability.
 * It tracks request counts, response times, error rates, and database performance.
 * 
 * Requirements: 8.1, 8.5
 */

export interface RequestMetrics {
  total: number;
  failed: number;
  successful: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number;
  failedQueries: number;
  lastUpdated: Date;
}

class MetricsCollector {
  private requestMetrics: RequestMetrics = {
    total: 0,
    failed: 0,
    successful: 0,
    averageResponseTime: 0,
    lastUpdated: new Date(),
  };

  private databaseMetrics: DatabaseMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    failedQueries: 0,
    lastUpdated: new Date(),
  };

  private responseTimes: number[] = [];
  private queryTimes: number[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * Record a request
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.requestMetrics.total++;
    if (success) {
      this.requestMetrics.successful++;
    } else {
      this.requestMetrics.failed++;
    }

    // Keep response times for average calculation
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxHistorySize) {
      this.responseTimes.shift();
    }

    // Calculate average response time
    this.requestMetrics.averageResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    this.requestMetrics.lastUpdated = new Date();
  }

  /**
   * Record a database query
   */
  recordDatabaseQuery(queryTime: number, success: boolean): void {
    this.databaseMetrics.queryCount++;
    if (!success) {
      this.databaseMetrics.failedQueries++;
    }

    // Keep query times for average calculation
    this.queryTimes.push(queryTime);
    if (this.queryTimes.length > this.maxHistorySize) {
      this.queryTimes.shift();
    }

    // Calculate average query time
    this.databaseMetrics.averageQueryTime =
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;

    this.databaseMetrics.lastUpdated = new Date();
  }

  /**
   * Get current request metrics
   */
  getRequestMetrics(): RequestMetrics {
    return { ...this.requestMetrics };
  }

  /**
   * Get current database metrics
   */
  getDatabaseMetrics(): DatabaseMetrics {
    return { ...this.databaseMetrics };
  }

  /**
   * Get error rate as percentage
   */
  getErrorRate(): number {
    if (this.requestMetrics.total === 0) return 0;
    return (this.requestMetrics.failed / this.requestMetrics.total) * 100;
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  reset(): void {
    this.requestMetrics = {
      total: 0,
      failed: 0,
      successful: 0,
      averageResponseTime: 0,
      lastUpdated: new Date(),
    };
    this.databaseMetrics = {
      queryCount: 0,
      averageQueryTime: 0,
      failedQueries: 0,
      lastUpdated: new Date(),
    };
    this.responseTimes = [];
    this.queryTimes = [];
  }

  /**
   * Get all metrics as a summary
   */
  getSummary() {
    return {
      requests: this.getRequestMetrics(),
      database: this.getDatabaseMetrics(),
      errorRate: this.getErrorRate(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
