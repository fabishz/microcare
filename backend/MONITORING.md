# Monitoring and Health Check Documentation

This document describes the monitoring and health check endpoints available in the MicroCare backend API.

## Overview

The backend provides comprehensive monitoring capabilities including:
- Health check endpoint for service availability
- Detailed metrics endpoint for performance monitoring
- Prometheus-compatible metrics endpoint
- Request/response metrics collection
- Database connectivity monitoring
- Memory and resource usage tracking

## Health Check Endpoint

### Endpoint: `GET /api/health`

Returns the current health status of the application and database.

**Response Status Codes:**
- `200 OK` - Application is healthy
- `503 Service Unavailable` - Application is degraded or unhealthy

**Response Format:**

```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": 2
  },
  "uptime": 3600.5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response Fields:**
- `status` (string): Overall health status - `healthy`, `degraded`, or `unhealthy`
- `database.connected` (boolean): Whether database connection is active
- `database.responseTime` (number): Database query response time in milliseconds
- `uptime` (number): Server uptime in seconds
- `timestamp` (string): ISO 8601 timestamp of the health check

**Example Usage:**

```bash
curl http://localhost:3000/api/health
```

## Metrics Endpoint

### Endpoint: `GET /api/metrics`

Returns detailed application metrics for monitoring and observability.

**Response Status Codes:**
- `200 OK` - Metrics retrieved successfully
- `500 Internal Server Error` - Failed to collect metrics

**Response Format:**

```json
{
  "status": "ok",
  "health": {
    "status": "healthy",
    "database": {
      "connected": true,
      "responseTime": 2
    },
    "uptime": 3600.5,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "metrics": {
    "requests": {
      "total": 150,
      "failed": 2,
      "successful": 148,
      "averageResponseTime": 45.3,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "database": {
      "queryCount": 450,
      "averageQueryTime": 5.2,
      "failedQueries": 0,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "errorRate": 1.33,
    "uptime": 3600.5,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 128,
      "external": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response Fields:**
- `status` (string): Response status - `ok` or `error`
- `health` (object): Current health status (same as `/api/health` endpoint)
- `metrics` (object): Detailed application metrics
  - `requests` (object): Request statistics
    - `total` (number): Total requests since server start
    - `failed` (number): Failed requests
    - `successful` (number): Successful requests
    - `averageResponseTime` (number): Average response time in milliseconds
    - `lastUpdated` (string): ISO 8601 timestamp of last update
  - `database` (object): Database statistics
    - `queryCount` (number): Total database queries
    - `averageQueryTime` (number): Average query time in milliseconds
    - `failedQueries` (number): Failed database queries
    - `lastUpdated` (string): ISO 8601 timestamp of last update
  - `errorRate` (number): Error rate as percentage
  - `uptime` (number): Server uptime in seconds
  - `memory` (object): Memory usage in MB
    - `heapUsed` (number): Heap memory used
    - `heapTotal` (number): Total heap memory
    - `external` (number): External memory usage

**Example Usage:**

```bash
curl http://localhost:3000/api/metrics
```

## Prometheus Metrics

### Endpoint: `GET /metrics`

Returns metrics in Prometheus text format suitable for scraping.

**Example Usage:**

```bash
curl http://localhost:3000/metrics
```

## Monitoring Integration

### Prometheus Integration

The metrics endpoint can be integrated with Prometheus for time-series monitoring:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'microcare-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Create a Grafana dashboard to visualize metrics:

1. Add Prometheus data source pointing to your Prometheus instance
2. Create panels for:
   - Request rate (requests/second)
   - Average response time
   - Error rate
   - Database connection status
   - Memory usage
   - Server uptime

### Health Check Monitoring

Use the health check endpoint for:
- Load balancer health checks
- Kubernetes liveness probes
- Uptime monitoring services
- Docker health checks

**Docker Health Check Example:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

**Kubernetes Liveness Probe Example:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

## Monitoring Best Practices

### 1. Health Check Frequency

- **Development**: Check every 10-30 seconds
- **Production**: Check every 30-60 seconds
- Avoid checking too frequently to prevent unnecessary load

### 2. Alert Thresholds

Set up alerts for:
- Health status changes from healthy to degraded/unhealthy
- Error rate exceeding 5%
- Average response time exceeding 1000ms
- Database connection failures
- Memory usage exceeding 80% of heap

### 3. Metrics Retention

- Keep metrics in memory for the last 1000 requests
- Implement periodic export to time-series database
- Archive metrics for historical analysis

### 4. Performance Considerations

- Health checks are lightweight (single database query)
- Metrics collection has minimal overhead
- Response times are tracked in milliseconds
- Memory usage is monitored continuously

## Troubleshooting

### Health Check Returns Degraded Status

1. Check database connectivity:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Verify database is running:
   ```bash
   psql -U postgres -d microcare -c "SELECT 1"
   ```

3. Check database connection string in `.env`

### High Error Rate in Metrics

1. Check application logs for errors
2. Review recent deployments or configuration changes
3. Monitor database performance
4. Check for network issues

### Memory Usage Increasing

1. Check for memory leaks in application code
2. Monitor database connection pool size
3. Review request/response sizes
4. Consider implementing request size limits

## Configuration

Monitoring configuration can be customized in `src/config/monitoring.ts`:

```typescript
export const defaultMonitoringConfig: MonitoringConfig = {
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
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
```

## API Reference

### Health Check Response Codes

| Status Code | Meaning | Action |
|------------|---------|--------|
| 200 | Healthy | Service is operational |
| 503 | Degraded/Unhealthy | Service has issues, may need restart |

### Metrics Response Codes

| Status Code | Meaning | Action |
|------------|---------|--------|
| 200 | Success | Metrics retrieved successfully |
| 500 | Error | Failed to collect metrics |

## Requirements

This monitoring implementation satisfies the following requirements:

- **Requirement 8.1**: Health check endpoints for monitoring
  - `GET /api/health` provides service availability status
  - `GET /api/metrics` provides detailed performance metrics

- **Requirement 8.5**: Database connectivity check
  - Health check includes database connection status
  - Response time metrics for database queries
  - Automatic status degradation on database failures

## Future Enhancements

Potential improvements for monitoring:

1. **Distributed Tracing**: Implement OpenTelemetry for request tracing
2. **Custom Metrics**: Add business logic metrics (e.g., entries created per hour)
3. **Alerting**: Integrate with alerting systems (PagerDuty, Slack)
4. **Log Aggregation**: Send logs to centralized logging service
5. **Performance Profiling**: Add CPU and I/O profiling capabilities
