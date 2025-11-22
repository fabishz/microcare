/**
 * Monitoring Configuration
 * 
 * This file contains configuration for monitoring and observability.
 * It includes health check settings, metrics collection, and dashboard configuration.
 * 
 * Requirements: 8.1, 8.5
 */

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  path: string;
}

export interface MetricsConfig {
  enabled: boolean;
  collectResponseTimes: boolean;
  collectErrorRates: boolean;
  collectDatabaseMetrics: boolean;
}

export interface DashboardConfig {
  enabled: boolean;
  path: string;
  refreshInterval: number; // milliseconds
  metrics: {
    uptime: boolean;
    responseTime: boolean;
    errorRate: boolean;
    databaseHealth: boolean;
    requestCount: boolean;
  };
}

export interface MonitoringConfig {
  healthCheck: HealthCheckConfig;
  metrics: MetricsConfig;
  dashboard: DashboardConfig;
}

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: MonitoringConfig = {
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    path: '/api/health',
  },
  metrics: {
    enabled: true,
    collectResponseTimes: true,
    collectErrorRates: true,
    collectDatabaseMetrics: true,
  },
  dashboard: {
    enabled: true,
    path: '/api/metrics',
    refreshInterval: 10000, // 10 seconds
    metrics: {
      uptime: true,
      responseTime: true,
      errorRate: true,
      databaseHealth: true,
      requestCount: true,
    },
  },
};

/**
 * Get monitoring configuration based on environment
 */
export function getMonitoringConfig(): MonitoringConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // In production, use stricter monitoring
  if (nodeEnv === 'production') {
    return {
      ...defaultMonitoringConfig,
      healthCheck: {
        ...defaultMonitoringConfig.healthCheck,
        interval: 60000, // 60 seconds in production
      },
      dashboard: {
        ...defaultMonitoringConfig.dashboard,
        refreshInterval: 30000, // 30 seconds in production
      },
    };
  }

  return defaultMonitoringConfig;
}

/**
 * Prometheus-compatible metrics format
 * This can be used for integration with monitoring tools like Prometheus, Grafana, etc.
 */
export interface PrometheusMetrics {
  'http_requests_total': number;
  'http_request_duration_seconds': number;
  'http_requests_failed_total': number;
  'database_connection_pool_size': number;
  'database_query_duration_seconds': number;
  'process_uptime_seconds': number;
}

/**
 * Health check response format
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    responseTime: number;
  };
  uptime: number;
  timestamp: string;
  error?: string;
}

/**
 * Metrics response format for dashboard
 */
export interface MetricsResponse {
  timestamp: string;
  uptime: number;
  requests: {
    total: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
    poolSize?: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}
