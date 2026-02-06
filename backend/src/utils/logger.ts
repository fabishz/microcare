import winston from 'winston';
import { getEnvConfig } from './env.js';

const envConfig = getEnvConfig();
const isProduction = envConfig.server.nodeEnv === 'production';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, ...rest }) => {
        const detail = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
        return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}${detail}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: logFormat,
    defaultMeta: { service: 'microcare-backend' },
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

export default logger;
