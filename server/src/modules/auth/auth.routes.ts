import { Router } from 'express';
import * as controller from './auth.controller.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rate-limit.js';
import { asyncHandler } from '../../lib/async-handler.js';

export const authRouter = Router();

authRouter.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(controller.login));
authRouter.post('/refresh', asyncHandler(controller.refresh));
authRouter.post('/logout', asyncHandler(controller.logout));
authRouter.post('/logout-all', authenticate, asyncHandler(controller.logoutAll));
authRouter.get('/me', authenticate, asyncHandler(controller.me));

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(controller.forgotPassword),
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(controller.resetPassword),
);
