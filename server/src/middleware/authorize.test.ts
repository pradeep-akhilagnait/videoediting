import { describe, expect, it } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { authorize } from './authorize.js';
import { AppError } from '../lib/errors.js';

const run = (req: Partial<Request>, ...codes: string[]): AppError | undefined => {
  let captured: unknown;
  const next: NextFunction = (err?: unknown) => {
    captured = err;
  };
  authorize(...codes)(req as Request, {} as Response, next);
  return captured instanceof AppError ? captured : undefined;
};

const withPerms = (...perms: string[]): Partial<Request> => ({
  auth: {
    userId: 1n,
    userPublicId: 'u',
    companyId: 1n,
    companyName: 'Co',
    role: 'Owner',
    permissions: new Set(perms),
  },
});

describe('authorize middleware', () => {
  it('allows when the user holds the required permission', () => {
    expect(run(withPerms('customer.manage'), 'customer.manage')).toBeUndefined();
  });

  it('denies with 403 when a permission is missing (default deny)', () => {
    const err = run(withPerms('customer.view'), 'customer.manage');
    expect(err?.status).toBe(403);
  });

  it('requires every listed permission', () => {
    const err = run(withPerms('customer.view'), 'customer.view', 'customer.manage');
    expect(err?.status).toBe(403);
  });

  it('returns 401 when the request is not authenticated', () => {
    expect(run({}, 'customer.view')?.status).toBe(401);
  });
});
