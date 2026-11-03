import { prisma } from '../../lib/prisma.js';

export type UserAccess = {
  userId: bigint;
  userPublicId: string;
  companyId: bigint;
  role: string;
  permissions: Set<string>;
};

/**
 * Load a user by their public id together with the permission codes their role
 * grants. Computed fresh on each request so a Manager's permission change takes
 * effect immediately (FR-1.6). Returns `null` if the user is missing, soft-
 * deleted or deactivated.
 */
export const loadUserAccess = async (userPublicId: string): Promise<UserAccess | null> => {
  const user = await prisma.user.findFirst({
    where: { publicId: userPublicId, isActive: true, deletedAt: null },
    select: {
      id: true,
      publicId: true,
      companyId: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { code: true } } } },
        },
      },
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    userPublicId: user.publicId,
    companyId: user.companyId,
    role: user.role?.name ?? '',
    permissions: new Set(user.role?.permissions.map((rp) => rp.permission.code) ?? []),
  };
};
