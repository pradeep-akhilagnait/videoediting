import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';

/**
 * Top-level API router. Each feature section (§2–§14) is added here as its own
 * module router.
 */
export const api = Router();

api.use('/health', healthRouter);
api.use('/auth', authRouter);
api.use('/customers', customersRouter);
api.use('/projects', projectsRouter);
