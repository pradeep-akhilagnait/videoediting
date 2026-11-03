import type { NextFunction, Request, Response } from 'express';
import type { PermissionCode } from '../config/permissions.js';
import { forbidden, unauthorized } from '../lib/errors.js';

/**
 * Guards a route with one or more permission codes (default deny, FR-1.7).
 * The user must be authenticated and hold EVERY listed permission.
 *
 *   router.post('/', authenticate, authorize(PERMISSIONS.QUOTATION_MANAGE), handler)
 */
export const authorize =
  (...required: PermissionCode[]) =>
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
