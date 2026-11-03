import { defineConfig } from 'vitest/config';

/**
 * Test environment.
 *
 * Unit tests (src/**) need nothing. Integration tests (tests/**) talk to a REAL
 * but SEPARATE MySQL database — never the production one. The DB name must
 * contain "test" (enforced in tests/helpers/db.ts) as a safety guard.
 *
 * Point it at your test DB with TEST_DATABASE_URL, e.g.
 *   mysql://varna_app:password@localhost:3306/varna_upvc_test
 * Load the schema + seed into that database once before running.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://root:password@localhost:3306/varna_upvc_test';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Integration tests reset shared tables, so run files one at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret',
      ACCESS_TOKEN_TTL: '15m',
      REFRESH_TOKEN_TTL_DAYS: '30',
    },
  },
});
