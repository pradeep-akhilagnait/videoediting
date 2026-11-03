import { z } from 'zod';

// Mirror the DB CHECK constraints so users get friendly errors, not DB errors.
// Accept lower/upper case; it is uppercased before saving to satisfy the DB CHECK.
const gstin = z
  .string()
  .regex(/^[0-9]{2}[A-Za-z0-9]{13}$/, 'GSTIN must be 15 characters (e.g. 36ABCDE1234F1Z5)');
const mobile = z.string().regex(/^[0-9+ -]{10,15}$/, 'Enter a valid mobile number');
const pincode = z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits');
const stateCode = z.string().regex(/^[0-9]{2}$/, 'Invalid state code');

/** Empty string from a form becomes `undefined` (an omitted optional field). */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const customerBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  companyName: optionalText(150),
  email: z
    .union([z.literal(''), z.email('Enter a valid email')])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined)),
  mobile: z.union([z.literal(''), mobile]).optional().transform((v) => (v ? v : undefined)),
  addressLine: optionalText(2000),
  city: optionalText(100),
  stateCode: z.union([z.literal(''), stateCode]).optional().transform((v) => (v ? v : undefined)),
  pincode: z.union([z.literal(''), pincode]).optional().transform((v) => (v ? v : undefined)),
  gstin: z
    .union([z.literal(''), gstin])
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const publicIdParam = z.object({
  publicId: z.uuid('Invalid id'),
});

export type CustomerBody = z.infer<typeof customerBodySchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
