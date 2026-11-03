import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { badRequest } from '../lib/errors.js';

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * Validates and coerces `req.body` / `req.query` / `req.params` against zod
 * schemas. On success the parsed (typed, trimmed) values replace the originals,
 * so handlers only ever see validated input. On failure it returns a 400 with a
 * field-by-field list of problems.
 */
export const validate =
  (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query'];
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        next(badRequest('Validation failed', fields));
        return;
      }
      next(error);
    }
  };
