import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { isProduction } from '../config/env.js';

/** 404 handler for routes that matched nothing. Must be registered last. */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'not_found', message: `Cannot ${req.method} ${req.path}` },
  });
};

/**
 * Central error handler. Known `AppError`s become clean JSON; anything else is
 * logged in full and returned as a generic 500 so internal details never leak.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: isProduction ? 'Something went wrong' : String(err),
    },
  });
};
