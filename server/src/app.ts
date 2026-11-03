import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { api } from './routes.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

/** Builds the configured Express app (kept separate from `listen` for testing). */
export const createApp = () => {
  const app = express();

  // Behind a reverse proxy in production, trust it so `req.ip` and secure
  // cookies work correctly.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true, // allow the refresh-token cookie
    }),
  );
  app.use(express.json({ limit: '2mb' })); // designs can be sizeable JSON
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.use('/api', apiLimiter, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
