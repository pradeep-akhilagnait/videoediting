import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/async-handler.js';

export const healthRouter = Router();

/** Liveness: the process is up. */
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/** Readiness: the database answers. Returns 503 if it does not. */
healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unavailable', reason: 'database' });
    }
  }),
);
