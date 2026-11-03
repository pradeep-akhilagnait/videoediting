import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const stateCode = z
  .union([z.literal(''), z.string().regex(/^[0-9]{2}$/, 'Invalid state code')])
  .optional()
  .transform((v) => (v ? v : undefined));

export const PROJECT_STATUSES = ['active', 'won', 'lost', 'completed', 'archived'] as const;

export const projectBodySchema = z.object({
  customerId: z.uuid('Select a customer'),
  name: z.string().trim().min(1, 'Project name is required').max(150),
  siteAddress: optionalText(2000),
  siteCity: optionalText(100),
  siteStateCode: stateCode,
  shippingAddress: optionalText(2000),
  status: z.enum(PROJECT_STATUSES).default('active'),
  notes: optionalText(2000),
});

/** Update allows changing everything except which customer the project belongs to. */
export const projectUpdateSchema = projectBodySchema.omit({ customerId: true });

export const bomBodySchema = z.object({
  name: z.string().trim().min(1, 'BOM name is required').max(150),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const publicIdParam = z.object({ publicId: z.uuid('Invalid id') });
export const bomParams = z.object({
  publicId: z.uuid('Invalid id'),
  bomId: z.uuid('Invalid id'),
});

export type ProjectBody = z.infer<typeof projectBodySchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type BomBody = z.infer<typeof bomBodySchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
