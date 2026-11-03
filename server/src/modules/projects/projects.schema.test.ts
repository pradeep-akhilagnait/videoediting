import { describe, expect, it } from 'vitest';
import { projectBodySchema } from './projects.schema.js';

const customerId = '11111111-1111-4111-8111-111111111111';

describe('projectBodySchema', () => {
  it('accepts a valid project and defaults status to active', () => {
    const parsed = projectBodySchema.parse({ customerId, name: 'Villa' });
    expect(parsed.status).toBe('active');
    expect(parsed.siteCity).toBeUndefined();
  });

  it('requires a customer id (uuid) and a name', () => {
    expect(() => projectBodySchema.parse({ name: 'Villa' })).toThrow();
    expect(() => projectBodySchema.parse({ customerId, name: '' })).toThrow();
  });

  it('rejects an unknown status', () => {
    expect(() => projectBodySchema.parse({ customerId, name: 'V', status: 'nope' })).toThrow();
  });
});
