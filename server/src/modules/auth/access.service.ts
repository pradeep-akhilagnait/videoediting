import { prisma } from '../../lib/prisma.js';

/**
 * Resolve a user's effective permission codes: the permissions granted to their
 * role, plus any per-user overrides (a grant with `granted = false` removes a
 * permission, `granted = true` adds one). Computed fresh on each request so a
 * Manager's permission change takes effect immediately (FR-1.6).
 *
 * Returns `null` if the user no longer exists or is deactivated.
 */
export const getEffectivePermissions = async (
  userId: string,
): Promise<{ role: string; permissions: Set<string> } | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { code: true } } } },
        },
      },
      permissionGrants: {
        select: { granted: true, permission: { select: { code: true } } },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const permissions = new Set(user.role.permissions.map((rp) => rp.permission.code));
  for (const grant of user.permissionGrants) {
    if (grant.granted) permissions.add(grant.permission.code);
    else permissions.delete(grant.permission.code);
  }

  return { role: user.role.name, permissions };
};
