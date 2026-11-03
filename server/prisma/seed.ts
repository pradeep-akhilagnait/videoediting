/**
 * Seed script: permission catalogue, the two roles with their default
 * permissions, and the first Manager account (FR-1.1 — created once at setup).
 *
 *   SEED_MANAGER_EMAIL=owner@knfab.in SEED_MANAGER_PASSWORD=... \
 *   SEED_MANAGER_NAME="Owner" npx tsx prisma/seed.ts
 *
 * Safe to re-run: it upserts and never overwrites an existing Manager password.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  PERMISSIONS,
  ROLE_NAMES,
  MANAGER_PERMISSIONS,
  STAFF_PERMISSIONS,
} from '../src/config/permissions.js';

const prisma = new PrismaClient();

async function main() {
  // 1. Permissions
  const allCodes = Object.values(PERMISSIONS);
  await Promise.all(
    allCodes.map((code) =>
      prisma.permission.upsert({ where: { code }, update: {}, create: { code } }),
    ),
  );
  const permissions = await prisma.permission.findMany();
  const idByCode = new Map(permissions.map((p) => [p.code, p.id]));

  // 2. Roles
  const manager = await prisma.role.upsert({
    where: { name: ROLE_NAMES.MANAGER },
    update: {},
    create: { name: ROLE_NAMES.MANAGER, description: 'Full control' },
  });
  const staff = await prisma.role.upsert({
    where: { name: ROLE_NAMES.STAFF },
    update: {},
    create: { name: ROLE_NAMES.STAFF, description: 'Day-to-day work' },
  });

  // 3. Role -> permission defaults
  const link = async (roleId: string, codes: string[]) => {
    for (const code of codes) {
      const permissionId = idByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  };
  await link(manager.id, MANAGER_PERMISSIONS);
  await link(staff.id, STAFF_PERMISSIONS);

  // 4. First Manager account
  const email = process.env.SEED_MANAGER_EMAIL?.toLowerCase();
  const password = process.env.SEED_MANAGER_PASSWORD;
  const name = process.env.SEED_MANAGER_NAME ?? 'Manager';
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, fullName: name, passwordHash: await bcrypt.hash(password, 12), roleId: manager.id },
      });
      console.log(`Created first Manager: ${email}`);
    } else {
      console.log(`Manager ${email} already exists — left unchanged`);
    }
  } else {
    console.log('Set SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD to create the first Manager.');
  }

  console.log(`Seeded ${allCodes.length} permissions and 2 roles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
