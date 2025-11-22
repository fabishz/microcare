# Graceful Shutdown and Error Recovery

This document describes the graceful shutdown mechanism and startup verification for the MicroCare backend.

## Overview

The backend implements a comprehensive graceful shutdown strategy that ensures:
- In-flight requests are completed before shutdown
- Database connections are properly closed
- No data loss during shutdown
- Clear logging of shutdown events
- Automatic recovery from startup failures

## Graceful Shutdown Implementation

### How It Works

When the server receives a termination signal (SIGTERM or SIGINT), it:

1. **Stops accepting new connections** - The HTTP server stops listening for new requests
2. **Waits for in-flight requests** - Existing connections are allowed to complete (with a timeout)
3. **Closes database connections** - Prisma client is properly disconnected
4. **Exits cleanly** - Process exits with status code 0 on success

### Signals Handled

- **SIGTERM** - Graceful termination signal (sent by container orchestration systems)
- **SIGINT** - Interrupt signal (Ctrl+C in terminal)
- **Uncaught Exceptions** - Triggers graceful shutdown on unhandled errors
- **Unhandled Promise Rejections** - Triggers graceful shutdown on unhandled promise rejections

### Configuration

The graceful shutdown behavior is configured with these constants in `src/index.ts`:

```typescript
const maxShutdownWaitTime = 30000; // 30 seconds
```

This timeout ensures the server doesn't hang indefinitely waiting for connections to close.

### Monitoring Active Connections

The server tracks active connections to know when all requests have completed:

```typescript
let activeConnections = 0;

server.on('connection', (conn) => {
  activeConnections++;
  conn.on('close', () => {
    activeConnections--;
  });
});
```

### Shutdown Flow

```
SIGTERM/SIGINT received
    ↓
Stop accepting new connections
    ↓
Wait for active connections to close (max 30s)
    ↓
Close database connections
    ↓
Exit with status 0
```

## Startup Verification

### Verification Script

The `verify-startup.ts` script validates that the server starts correctly and is ready to handle requests.

#### Usage

```bash
npm run verify-startup
```

#### What It Checks

1. **Server Process** - Verifies the server process starts without errors
2. **Health Endpoint** - Confirms the `/api/health` endpoint is responding
3. **Database Connectivity** - Validates database connection status
4. **Startup Time** - Ensures startup completes within 30 seconds

#### Output Example

```
═══════════════════════════════════════════════════════════
  MicroCare Backend Startup Verification
═══════════════════════════════════════════════════════════

Starting server on port 3000...
Health check endpoint: http://localhost:3000/api/health
Max startup time: 30000ms

Waiting for server to be ready...
✓ Server is responding to health checks
Verifying database connectivity...
✓ Database is connected

═══════════════════════════════════════════════════════════
✓ Server startup verification completed successfully
═══════════════════════════════════════════════════════════
```

## Health Check Endpoints

### GET /api/health

Returns the current health status of the server and database.

**Response (200 OK - Healthy)**:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": 5
  },
  "uptime": 123.456,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (503 Service Unavailable - Degraded)**:
```json
{
  "status": "degraded",
  "database": {
    "connected": false,
    "responseTime": 0
  },
  "uptime": 123.456,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/metrics

Returns detailed metrics including health status, request metrics, database metrics, and memory usage.

**Response (200 OK)**:
```json
{
  "status": "ok",
  "health": {
    "status": "healthy",
    "database": {
      "connected": true,
      "responseTime": 5
    },
    "uptime": 123.456,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "metrics": {
    "requests": {
      "total": 150,
      "successful": 145,
      "failed": 5,
      "averageResponseTime": 45.2,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "database": {
      "queryCount": 500,
      "averageQueryTime": 10.5,
      "failedQueries": 2,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "errorRate": 0.033,
    "uptime": 123.456,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 128,
      "external": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Docker Integration

### Graceful Shutdown in Docker

When running in Docker, the container orchestration system sends SIGTERM to gracefully stop the container:

```dockerfile
# The server will receive SIGTERM and perform graceful shutdown
STOPSIGNAL SIGTERM
```

### Health Check in Docker

Docker can use the health check endpoint to monitor container health:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## Kubernetes Integration

### Graceful Shutdown in Kubernetes

Kubernetes sends SIGTERM when terminating pods. Configure the termination grace period:

```yaml
spec:
  terminationGracePeriodSeconds: 40  # Allow 40s for graceful shutdown
  containers:
  - name: backend
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 5"]  # Optional: delay before SIGTERM
```

### Liveness and Readiness Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Error Recovery

### Uncaught Exceptions

If an uncaught exception occurs, the server will:
1. Log the error
2. Initiate graceful shutdown
3. Exit with status code 1

### Unhandled Promise Rejections

If an unhandled promise rejection occurs, the server will:
1. Log the rejection
2. Initiate graceful shutdown
3. Exit with status code 1

### Database Connection Failures

If the database connection fails during startup:
1. The server will retry up to 5 times with 2-second delays
2. If all retries fail, the server exits with status code 1
3. Logs indicate the connection failure and troubleshooting steps

## Monitoring and Logging

### Startup Logs

```
✓ Database connected successfully
Running database migrations...
✓ Server running on port 3000
```

### Shutdown Logs

```
SIGTERM received, initiating graceful shutdown...
✓ Server stopped accepting new connections
  Waiting for 2 active connection(s) to close...
  Waiting for 1 active connection(s) to close...
✓ All active connections closed
Closing database connections...
✓ Database connections closed
✓ Graceful shutdown completed successfully
```

### Error Logs

```
✗ Uncaught exception: Error message
✗ Unhandled rejection at: Promise reason: Error message
✗ Database connection failed: Connection refused
```

## Best Practices

### For Deployment

1. **Set appropriate termination grace period** - Allow enough time for graceful shutdown (30-40 seconds)
2. **Monitor health endpoints** - Use `/api/health` for liveness and readiness checks
3. **Log shutdown events** - Monitor logs for graceful shutdown completion
4. **Test shutdown behavior** - Verify graceful shutdown works in your environment

### For Development

1. **Use Ctrl+C to stop** - Allows graceful shutdown in development
2. **Monitor active connections** - Check logs to see connection handling
3. **Test with load** - Verify graceful shutdown with multiple concurrent requests
4. **Verify startup** - Use `npm run verify-startup` to validate startup process

## Troubleshooting

### Server doesn't shut down gracefully

**Symptoms**: Server takes longer than expected to shut down or doesn't shut down at all

**Solutions**:
1. Check for long-running requests that don't complete
2. Verify database connections are being closed properly
3. Check for event listeners that prevent process exit
4. Increase `maxShutdownWaitTime` if needed

### Health check fails

**Symptoms**: `/api/health` returns 503 or times out

**Solutions**:
1. Verify database is running and accessible
2. Check database connection string in environment variables
3. Review database logs for connection errors
4. Ensure migrations have completed successfully

### Startup verification fails

**Symptoms**: `npm run verify-startup` reports startup failure

**Solutions**:
1. Check server logs for startup errors
2. Verify environment variables are set correctly
3. Ensure database is running and migrations are applied
4. Check port availability (ensure port 3000 is not in use)

## Requirements

This implementation satisfies the following requirements:

- **Requirement 8.2**: Graceful shutdown on SIGTERM/SIGINT with proper connection and database cleanup
- **Requirement 8.1**: Health check endpoints for monitoring
- **Requirement 8.5**: Metrics collection and monitoring infrastructure

## References

- [Node.js Graceful Shutdown](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/#handling-signals-properly)
- [Docker STOPSIGNAL](https://docs.docker.com/engine/reference/builder/#stopsignal)
- [Kubernetes Termination Grace Period](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#termination-of-pods)
- [Express Server Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html)
