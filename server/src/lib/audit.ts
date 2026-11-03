import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

type AuditInput = {
  companyId?: bigint | null;
  tableName: string;
  recordId?: bigint | null;
  action: 'insert' | 'update' | 'delete' | 'restore';
  changedBy?: bigint | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Write one row to `audit_log` (FR-1.10, launch-schema rule 8). Auditing must
 * never break the operation it records, so failures are logged and swallowed.
 * Call it after the change has committed.
 */
export const recordAudit = async (input: AuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId ?? null,
        tableName: input.tableName,
        recordId: input.recordId ?? null,
        action: input.action,
        changedBy: input.changedBy ?? null,
        oldData: (input.before ?? Prisma.DbNull) as Prisma.InputJsonValue,
        newData: (input.after ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    logger.error({ error, tableName: input.tableName }, 'Failed to write audit log');
  }
};

/** Convenience wrapper that fills company and actor from the request. */
export const auditFromRequest = (
  req: Request,
  input: Omit<AuditInput, 'companyId' | 'changedBy'>,
): Promise<void> =>
  recordAudit({
    ...input,
    companyId: req.auth?.companyId ?? null,
    changedBy: req.auth?.userId ?? null,
  });
