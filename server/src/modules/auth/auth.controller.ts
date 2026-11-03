import type { CookieOptions, Request, Response } from 'express';
import * as authService from './auth.service.js';
import { getEffectivePermissions } from './access.service.js';
import { refreshTokenMaxAgeMs } from './tokens.js';
import { isProduction } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const REFRESH_COOKIE = 'refresh_token';

/** httpOnly cookie so the refresh token is never exposed to JavaScript (XSS-safe). */
const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: refreshTokenMaxAgeMs,
});

const ctxFromRequest = (req: Request) => ({
  ip: req.ip ?? null,
  userAgent: req.get('user-agent') ?? null,
});

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const tokens = await authService.login(email, password, ctxFromRequest(req));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.json({ accessToken: tokens.accessToken, user: tokens.user });
};

export const refresh = async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw unauthorized('No session');
  const tokens = await authService.refresh(raw, ctxFromRequest(req));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.json({ accessToken: tokens.accessToken, user: tokens.user });
};

export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(204).end();
};

export const logoutAll = async (req: Request, res: Response) => {
  if (!req.auth) throw unauthorized();
  await authService.logoutAll(req.auth.userId);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(204).end();
};

/** Who am I — current user plus their effective permissions, for the SPA to drive its UI. */
export const me = async (req: Request, res: Response) => {
  if (!req.auth) throw unauthorized();
  const access = await getEffectivePermissions(req.auth.userId);
  if (!access) throw unauthorized();
  res.json({
    user: { id: req.auth.userId, role: access.role },
    permissions: [...access.permissions],
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const result = await authService.requestPasswordReset(req.body.email);
  if (result) {
    // TODO(email): send the reset link containing `result.token` to the user.
    // The token is never returned in the response. Logged here only in dev.
    if (!isProduction) {
      logger.info({ resetToken: result.token }, 'Password reset token (dev only)');
    }
  }
  // Same response whether or not the email exists, to avoid account enumeration.
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ message: 'Password updated. Please sign in again.' });
};
