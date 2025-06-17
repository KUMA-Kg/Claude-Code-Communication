import winston from 'winston';
import { env } from '@/config/environment';
import path from 'path';
import fs from 'fs';

const logDir = path.dirname(env.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'it-subsidy-assistant-backend' },
  transports: [
    new winston.transports.File({
      filename: env.LOG_FILE,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    })
  ]
});

if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

if (env.NODE_ENV === 'test') {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

export { logger };