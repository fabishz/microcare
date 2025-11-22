import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { connectDatabase, disconnectDatabase } from './utils/database.js';
import { runPendingMigrations } from './utils/migrations.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeRequestBody, sanitizeQueryParams, sanitizeUrlParams } from './middleware/validationMiddleware.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { validateEnv, getEnvConfig } from './utils/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import entryRoutes from './routes/entryRoutes.js';

dotenv.config();

// Validate environment variables on startup
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const app = express();
const envConfig = getEnvConfig();
const PORT = envConfig.server.port;
const isProduction = envConfig.server.nodeEnv === 'production';

// Trust proxy for HTTPS enforcement behind load balancers
if (envConfig.security.trustProxy) {
  app.set('trust proxy', 1);
}

// HTTPS enforcement middleware for production
if (envConfig.security.httpsOnly) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
      res.redirect(301, `https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security middleware with comprehensive headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", envConfig.cors.frontendUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// CORS middleware with frontend domain whitelist
const allowedOrigins = envConfig.cors.frontendUrl.split(',').map(url => url.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Secure cookie settings middleware
app.use((_req, res, next) => {
  // Wrap the cookie method to apply secure defaults
  const originalCookie = res.cookie.bind(res);
  res.cookie = function(name: string, val: string, options: any = {}) {
    const cookieOptions = {
      ...options,
      httpOnly: true, // Prevent XSS attacks
      secure: isProduction || envConfig.security.httpsOnly, // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      path: '/',
    };
    return originalCookie(name, val, cookieOptions);
  };
  next();
});

// Request body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Input sanitization middleware (prevent XSS and injection attacks)
// Requirements: 4.1, 4.2
app.use(sanitizeRequestBody);
app.use(sanitizeQueryParams);
app.use(sanitizeUrlParams);

// Request logging middleware
app.use(requestLogger);

// Metrics collection middleware
// Requirements: 8.1, 8.5
app.use(metricsMiddleware);

// Health check endpoint with detailed metrics
// Requirements: 8.1, 8.5
app.get('/api/health', async (_req, res) => {
  try {
    const { getDetailedHealthStatus } = await import('./utils/database.js');
    const healthStatus = await getDetailedHealthStatus();
    
    // Return appropriate status code based on health
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: {
        connected: false,
        responseTime: 0,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Metrics endpoint for monitoring dashboard
// Requirements: 8.1, 8.5
app.get('/api/metrics', async (_req, res) => {
  try {
    const { metricsCollector } = await import('./utils/metrics.js');
    const { getDetailedHealthStatus } = await import('./utils/database.js');
    
    const healthStatus = await getDetailedHealthStatus();
    const metricsSummary = metricsCollector.getSummary();

    res.json({
      status: 'ok',
      health: healthStatus,
      metrics: {
        requests: metricsSummary.requests,
        database: metricsSummary.database,
        errorRate: metricsSummary.errorRate,
        uptime: metricsSummary.uptime,
        memory: {
          heapUsed: Math.round(metricsSummary.memory.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(metricsSummary.memory.heapTotal / 1024 / 1024), // MB
          external: Math.round(metricsSummary.memory.external / 1024 / 1024), // MB
        },
      },
      timestamp: metricsSummary.timestamp,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to collect metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

// Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MicroCare API Documentation',
}));

// Authentication routes
app.use('/api/auth', authRoutes);

// User profile routes
app.use('/api/users', userRoutes);

// Journal entry routes
app.use('/api/entries', entryRoutes);

// 404 Not Found middleware (place before error handler)
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Run pending database migrations
    // Requirements: 6.1, 6.4
    try {
      console.log('Running database migrations...');
      await runPendingMigrations();
    } catch (migrationError) {
      console.error('✗ Failed to run database migrations:', migrationError instanceof Error ? migrationError.message : String(migrationError));
      console.error('Server startup aborted due to migration failure');
      await disconnectDatabase();
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
