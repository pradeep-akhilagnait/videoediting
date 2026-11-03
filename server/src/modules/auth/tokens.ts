import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';

export type AccessTokenPayload = {
  sub: string; // user id
  role: string; // role name, for coarse UI checks; fine-grained perms are checked server-side
};

/** Sign a short-lived access token used as a Bearer token on API calls. */
export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);

/** Verify an access token, throwing a 401 if it is missing, expired or invalid. */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw unauthorized('Invalid access token');
    }
    return { sub: decoded.sub, role: String(decoded.role ?? '') };
  } catch {
    throw unauthorized('Invalid or expired access token');
  }
};

export const refreshTokenMaxAgeMs = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
