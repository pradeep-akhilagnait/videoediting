import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env.js';

/**
 * A single shared PrismaClient for the process. In development we stash it on
 * `globalThis` so hot-reloads (tsx watch) don't open a new pool each time.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['warn', 'error'] : ['query', 'warn', 'error'],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
