/**
 * Environment variable validation utility
 * Ensures all required environment variables are set on startup
 */

interface EnvConfig {
  database: {
    url: string;
    urlUnpooled: string;
  };
  jwt: {
    secret: string;
    expiration: string;
    refreshTokenExpiration: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  cors: {
    frontendUrl: string;
  };
  security: {
    httpsOnly: boolean;
    trustProxy: boolean;
  };
}

/**
 * Validate and parse environment variables
 * Throws an error if required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  const requiredVars = [
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
    'JWT_SECRET',
    'JWT_EXPIRATION',
    'REFRESH_TOKEN_EXPIRATION',
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please create a .env.local file in the backend directory with all required variables.\n` +
      `You can use .env.example as a template.`
    );
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  const validNodeEnvs = ['development', 'staging', 'production', 'test'];
  if (!validNodeEnvs.includes(process.env.NODE_ENV || '')) {
    throw new Error(
      `Invalid NODE_ENV value: ${process.env.NODE_ENV}. ` +
      `Must be one of: ${validNodeEnvs.join(', ')}`
    );
  }

  const nodeEnv = process.env.NODE_ENV!;
  const httpsOnly = nodeEnv === 'production' || process.env.HTTPS_ONLY === 'true';
  const trustProxy = nodeEnv === 'production' || process.env.TRUST_PROXY === 'true';

  return {
    database: {
      url: process.env.DATABASE_URL!,
      urlUnpooled: process.env.DATABASE_URL_UNPOOLED!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiration: process.env.JWT_EXPIRATION!,
      refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION!,
    },
    server: {
      port,
      nodeEnv,
    },
    cors: {
      frontendUrl: process.env.FRONTEND_URL!,
    },
    security: {
      httpsOnly,
      trustProxy,
    },
  };
}

/**
 * Get validated environment configuration
 * Should be called once at application startup
 */
let envConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv();
  }
  return envConfig;
}
