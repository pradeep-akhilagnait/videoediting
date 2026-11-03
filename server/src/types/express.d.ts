import 'express';

declare global {
  namespace Express {
    /** Set by the `authenticate` middleware once a valid access token is verified. */
    interface Request {
      auth?: {
        userId: string;
        role: string;
        permissions: Set<string>;
      };
    }
  }
}

export {};
