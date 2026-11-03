import pino from 'pino';
import { isProduction } from '../config/env.js';

/**
 * Application logger. Pretty, human-readable in development; structured JSON in
 * production (where a log collector parses it).
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
      },
  // Never log credentials or tokens, even if they show up in a bound object.
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
});
