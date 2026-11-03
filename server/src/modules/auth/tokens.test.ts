import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from './tokens.js';

describe('access tokens', () => {
  it('round-trips the subject and role', () => {
    const token = signAccessToken({ sub: 'user-public-id', role: 'Owner' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-public-id');
    expect(payload.role).toBe('Owner');
  });

  it('rejects a tampered or invalid token', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow();
  });
});
