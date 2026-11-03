import rateLimit from 'express-rate-limit';

const rateLimitResponse = {
  error: { code: 'too_many_requests', message: 'Too many requests, please try again later' },
};

/** Generous limit for ordinary API traffic. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Strict limit for login and password reset, to slow brute-force attempts (FR-1.5). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse,
});
