import type { Request } from 'express';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

type AuditInput = {
  userId?: string | null;
  action: 'create' | 'update' | 'delete' | (string & {});
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
};

/**
 * Record a create / update / delete in the audit log (FR-1.10). Auditing must
 * never break the operation it is recording, so failures are logged and
 * swallowed rather than thrown. Call it after the change has committed.
 */
export const recordAudit = async (input: AuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: (input.before ?? undefined) as never,
        after: (input.after ?? undefined) as never,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    logger.error({ error, entityType: input.entityType }, 'Failed to write audit log');
  }
};

/** Convenience wrapper that pulls the acting user and IP from the request. */
export const auditFromRequest = (
  req: Request,
  input: Omit<AuditInput, 'userId' | 'ip'>,
): Promise<void> => recordAudit({ ...input, userId: req.auth?.userId ?? null, ip: req.ip });
