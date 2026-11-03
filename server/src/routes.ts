import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';

/**
 * Top-level API router. Each feature section (§2–§14) is added here as its own
 * module router, e.g. `api.use('/customers', customerRouter)`.
 */
export const api = Router();

api.use('/health', healthRouter);
api.use('/auth', authRouter);
