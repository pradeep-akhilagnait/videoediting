import 'express';

declare global {
  namespace Express {
    /** Set by the `authenticate` middleware once a valid access token is verified. */
    interface Request {
      auth?: {
        /** Internal user id (BigInt). Used for DB writes (created_by, etc.). */
        userId: bigint;
        /** Public, non-guessable user id. Safe to expose in URLs/responses. */
        userPublicId: string;
        /** Tenant. Every query must be filtered by this (never trust the request). */
        companyId: bigint;
        companyName: string;
        role: string;
        permissions: Set<string>;
      };
    }
  }
}

export {};
