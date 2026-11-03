import { describe, expect, it } from 'vitest';
import { customerBodySchema } from './customers.schema.js';

describe('customerBodySchema', () => {
  it('accepts a valid customer and normalises values', () => {
    const parsed = customerBodySchema.parse({
      name: '  Acme  ',
      email: 'SALES@ACME.IN',
      gstin: '36abcde1234f1z5',
      mobile: '9876543210',
      companyName: '',
    });
    expect(parsed.name).toBe('Acme');
    expect(parsed.email).toBe('sales@acme.in');
    expect(parsed.gstin).toBe('36ABCDE1234F1Z5');
    expect(parsed.companyName).toBeUndefined(); // empty string -> omitted
  });

  it('requires a name', () => {
    expect(() => customerBodySchema.parse({ name: '' })).toThrow();
  });

  it('rejects a malformed GSTIN', () => {
    expect(() => customerBodySchema.parse({ name: 'X', gstin: '123' })).toThrow();
  });

  it('rejects a malformed mobile', () => {
    expect(() => customerBodySchema.parse({ name: 'X', mobile: 'abcd' })).toThrow();
  });

  it('rejects a malformed pincode', () => {
    expect(() => customerBodySchema.parse({ name: 'X', pincode: '12' })).toThrow();
  });
});
