import type { CookieOptions, Request, Response } from 'express';
import * as authService from './auth.service.js';
import { refreshTokenMaxAgeMs } from './tokens.js';
import { isProduction } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';

const REFRESH_COOKIE = 'refresh_token';

/** httpOnly cookie so the refresh token is never exposed to JavaScript (XSS-safe). */
const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: refreshTokenMaxAgeMs,
});

const ctxFromRequest = (req: Request) => ({ userAgent: req.get('user-agent') ?? null });

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

/** Current user + effective permissions, for the SPA to drive its UI. */
export const me = async (req: Request, res: Response) => {
  if (!req.auth) throw unauthorized();
  res.json({
    user: { publicId: req.auth.userPublicId, role: req.auth.role },
    permissions: [...req.auth.permissions],
  });
};
