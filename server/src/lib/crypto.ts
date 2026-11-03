import { createHash, randomBytes } from 'node:crypto';

/** A long, URL-safe random token (for refresh tokens and password resets). */
export const randomToken = (bytes = 48): string => randomBytes(bytes).toString('base64url');

/**
 * SHA-256 hash of a token, hex-encoded. We store only the hash of long random
 * tokens so a database leak does not expose usable tokens. (Passwords use
 * bcrypt instead — see the auth service.)
 */
export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
