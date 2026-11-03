import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/tokens.js';
import { getEffectivePermissions } from '../modules/auth/access.service.js';
import { unauthorized } from '../lib/errors.js';
import { asyncHandler } from '../lib/async-handler.js';

/**
 * Requires a valid `Authorization: Bearer <access token>`. Verifies the token,
 * re-loads the user's current role and permissions, and attaches them to
 * `req.auth`. A token for a deleted or deactivated user is rejected.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized('Missing access token');
    }

    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    const access = await getEffectivePermissions(payload.sub);
    if (!access) {
      throw unauthorized('Account is no longer active');
    }

    req.auth = { userId: payload.sub, role: access.role, permissions: access.permissions };
    next();
  },
);
