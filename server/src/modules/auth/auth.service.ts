import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { randomToken, sha256 } from '../../lib/crypto.js';
import { unauthorized } from '../../lib/errors.js';
import { signAccessToken, refreshTokenMaxAgeMs } from './tokens.js';
import { logger } from '../../lib/logger.js';

const BCRYPT_ROUNDS = 12;

export type AuthUser = {
  publicId: string;
  name: string;
  email: string;
  role: string;
  company: { publicId: string; name: string };
};

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string; // raw; the controller sets it as an httpOnly cookie
  user: AuthUser;
};

type RequestContext = { userAgent?: string | null };

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_ROUNDS);

type LoadedUser = {
  id: bigint;
  publicId: string;
  companyId: bigint;
  name: string;
  email: string;
  role: { name: string } | null;
  company: { publicId: string; name: string };
};

const toAuthUser = (user: LoadedUser): AuthUser => ({
  publicId: user.publicId,
  name: user.name,
  email: user.email,
  role: user.role?.name ?? '',
  company: { publicId: user.company.publicId, name: user.company.name },
});

/** Create a refresh-token session row and sign a matching access token. */
const issueTokens = async (user: LoadedUser, ctx: RequestContext): Promise<IssuedTokens> => {
  const refreshToken = randomToken();
  await prisma.userSession.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
      userAgent: ctx.userAgent?.slice(0, 500) ?? null,
    },
  });

  const accessToken = signAccessToken({ sub: user.publicId, role: user.role?.name ?? '' });
  return { accessToken, refreshToken, user: toAuthUser(user) };
};

const userSelect = {
  id: true,
  publicId: true,
  companyId: true,
  name: true,
  email: true,
  passwordHash: true,
  isActive: true,
  deletedAt: true,
  role: { select: { name: true } },
  company: { select: { publicId: true, name: true } },
} as const;

/** Verify email + password and start a new login session (FR-1.2). */
export const login = async (
  email: string,
  password: string,
  ctx: RequestContext,
): Promise<IssuedTokens> => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: userSelect,
  });

  // Always run a bcrypt comparison, present user or not, so response timing
  // can't be used to tell which emails exist.
  const hash = user?.passwordHash ?? '$2a$12$0000000000000000000000000000000000000000000000000000a';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok || !user.isActive) {
    throw unauthorized('Invalid email or password');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return issueTokens(user, ctx);
};

/**
 * Rotate a refresh token (FR-1.3). The presented token is revoked and a new one
 * issued. Presenting an already-revoked token means a stolen token is being
 * replayed, so every session for that user is revoked.
 */
export const refresh = async (rawToken: string, ctx: RequestContext): Promise<IssuedTokens> => {
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: sha256(rawToken) },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: userSelect },
    },
  });

  if (!session) {
    throw unauthorized('Invalid refresh token');
  }

  if (session.revokedAt) {
    // Replay of a revoked token -> revoke all of the user's sessions.
    logger.warn({ userId: String(session.userId) }, 'Refresh token replay detected');
    await prisma.userSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized('Session expired, please sign in again');
  }

  if (session.expiresAt < new Date() || !session.user.isActive || session.user.deletedAt) {
    throw unauthorized('Session expired, please sign in again');
  }

  const tokens = await issueTokens(session.user, ctx);
  await prisma.userSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date(), lastUsedAt: new Date() },
  });
  return tokens;
};

/** Revoke the session behind a single refresh token (logout). */
export const logout = async (rawToken: string | undefined): Promise<void> => {
  if (!rawToken) return;
  await prisma.userSession.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/** Revoke every active session for a user (logout from all devices, FR-1.2). */
export const logoutAll = async (userId: bigint): Promise<void> => {
  await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

// NOTE (FR-1.4, forgot/reset password): the launch schema has no table to hold
// reset tokens. Implementing it needs a small additive `password_resets` table
// (id, user_id, token_hash, expires_at, used_at). Left out until that table is
// agreed, so we don't invent storage the DB doesn't have.
