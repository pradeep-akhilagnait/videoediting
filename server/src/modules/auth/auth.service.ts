import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { randomToken, sha256 } from '../../lib/crypto.js';
import { badRequest, unauthorized } from '../../lib/errors.js';
import { signAccessToken, refreshTokenMaxAgeMs } from './tokens.js';
import { logger } from '../../lib/logger.js';

const BCRYPT_ROUNDS = 12;

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string; // raw; returned to the caller to set as an httpOnly cookie
  user: { id: string; email: string; fullName: string; role: string };
};

type RequestContext = { ip?: string | null; userAgent?: string | null };

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_ROUNDS);

/**
 * Create a new refresh-token session and sign an access token for it.
 * `familyId` ties a rotation chain together so token reuse can be detected.
 */
const issueSession = async (
  user: { id: string; email: string; fullName: string; roleName: string },
  familyId: string,
  ctx: RequestContext,
): Promise<IssuedTokens> => {
  const refreshToken = randomToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      familyId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.roleName });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.roleName },
  };
};

/** Verify email + password and start a new login session (FR-1.2). */
export const login = async (
  email: string,
  password: string,
  ctx: RequestContext,
): Promise<IssuedTokens> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, fullName: true, passwordHash: true, isActive: true, role: { select: { name: true } } },
  });

  // Always run a bcrypt comparison to keep timing consistent whether or not the
  // email exists, so the response time can't be used to enumerate accounts.
  const hash = user?.passwordHash ?? '$2a$12$0000000000000000000000000000000000000000000000000000a';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok || !user.isActive) {
    throw unauthorized('Invalid email or password');
  }

  return issueSession(
    { id: user.id, email: user.email, fullName: user.fullName, roleName: user.role.name },
    randomUUID(),
    ctx,
  );
};

/**
 * Rotate a refresh token (FR-1.3). The presented token is retired and a new one
 * issued in the same family. If a token that was already rotated out is
 * presented again, that is reuse of a stolen token: the entire family is
 * revoked and the user is logged out everywhere.
 */
export const refresh = async (rawToken: string, ctx: RequestContext): Promise<IssuedTokens> => {
  const tokenHash = sha256(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      familyId: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: { id: true, email: true, fullName: true, isActive: true, role: { select: { name: true } } } },
    },
  });

  if (!session) {
    throw unauthorized('Invalid refresh token');
  }

  // Reuse of an already-rotated/revoked token -> revoke the whole family.
  if (session.revokedAt) {
    logger.warn({ userId: session.userId, familyId: session.familyId }, 'Refresh token reuse detected');
    await prisma.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized('Session expired, please sign in again');
  }

  if (session.expiresAt < new Date() || !session.user.isActive) {
    throw unauthorized('Session expired, please sign in again');
  }

  const newTokens = await issueSession(
    {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roleName: session.user.role.name,
    },
    session.familyId,
    ctx,
  );

  // Retire the presented token now that its replacement exists. It keeps its
  // own hash, so presenting it again later is caught as reuse above.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return newTokens;
};

/** Revoke the session behind a single refresh token (logout). */
export const logout = async (rawToken: string | undefined): Promise<void> => {
  if (!rawToken) return;
  await prisma.session.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/** Revoke every active session for a user (logout from all devices, FR-1.2). */
export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Begin a password reset (FR-1.4). Returns the raw token to email to the user.
 * To avoid leaking which emails exist, the caller responds the same way whether
 * or not an account was found — this returns `null` for an unknown email.
 */
export const requestPasswordReset = async (email: string): Promise<{ token: string; userId: string } | null> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  const token = randomToken();
  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS) },
  });
  return { token, userId: user.id };
};

/** Complete a password reset: set the new password and log out all sessions. */
export const resetPassword = async (rawToken: string, newPassword: string): Promise<void> => {
  const reset = await prisma.passwordReset.findUnique({
    where: { tokenHash: sha256(rawToken) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw badRequest('This reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    // A password change invalidates every existing session.
    prisma.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
};
