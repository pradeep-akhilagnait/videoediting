import type { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../lib/errors.js';

/**
 * Guards a route with one or more permission codes (default deny, FR-1.7). The
 * user must be authenticated and hold EVERY listed permission. Codes are the
 * strings in the `permissions` table (see src/config/permissions.ts).
 *
 *   router.post('/', authenticate, authorize('quotation.manage'), handler)
 */
export const authorize =
  (...required: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(unauthorized());
      return;
    }
    const missing = required.filter((code) => !req.auth!.permissions.has(code));
    if (missing.length > 0) {
      next(forbidden(`Missing permission: ${missing.join(', ')}`));
      return;
    }
    next();
  };
