import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma.js';

/**
 * SAFETY: refuse to run against anything but a database whose name contains
 * "test". This prevents a mis-set DATABASE_URL from wiping real data.
 */
function assertTestDatabase() {
  const url = process.env.DATABASE_URL ?? '';
  const dbName = url.split('/').pop()?.split('?')[0] ?? '';
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run tests against "${dbName}". The test database name must contain "test".`,
    );
  }
}

/** Wipe business data + per-company roles, keeping seed data (states, permissions, templates). */
export async function resetDb() {
  assertTestDatabase();
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'audit_log',
    'user_sessions',
    'project_boms',
    'projects',
    'customers',
    'users',
  ]) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
  // Per-company roles only (keep the NULL-company templates from the seed).
  await prisma.$executeRawUnsafe(
    'DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM (SELECT id FROM roles WHERE company_id IS NOT NULL) x)',
  );
  await prisma.$executeRawUnsafe('DELETE FROM roles WHERE company_id IS NOT NULL');
  await prisma.$executeRawUnsafe('DELETE FROM companies');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
}

export type SeededUser = { publicId: string; email: string; password: string };
export type SeededCompany = {
  id: bigint;
  publicId: string;
  owner: SeededUser;
  staff: SeededUser;
};

const PASSWORD = 'Password123';

/** Copy the seed's template roles into a company and return a name->id map. */
async function copyTemplateRoles(companyId: bigint): Promise<Map<string, bigint>> {
  const templates = await prisma.role.findMany({
    where: { companyId: null },
    select: { name: true, description: true, isSystem: true, permissions: { select: { permissionId: true } } },
  });
  const map = new Map<string, bigint>();
  for (const t of templates) {
    const role = await prisma.role.create({
      data: { companyId, name: t.name, description: t.description, isSystem: t.isSystem },
    });
    if (t.permissions.length) {
      await prisma.rolePermission.createMany({
        data: t.permissions.map((p) => ({ roleId: role.id, permissionId: p.permissionId })),
      });
    }
    map.set(t.name, role.id);
  }
  return map;
}

let companyCounter = 0;

/** Create a company with an Owner and a Staff (view-only) user. */
async function seedCompany(label: string): Promise<SeededCompany> {
  const company = await prisma.company.create({ data: { name: label, stateCode: '36' } });
  const roles = await copyTemplateRoles(company.id);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  companyCounter += 1;

  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      name: `${label} Owner`,
      email: `owner${companyCounter}@test.local`,
      passwordHash,
      roleId: roles.get('Owner')!,
    },
    select: { publicId: true, email: true },
  });
  const staff = await prisma.user.create({
    data: {
      companyId: company.id,
      name: `${label} Staff`,
      email: `staff${companyCounter}@test.local`,
      passwordHash,
      roleId: roles.get('Staff')!,
    },
    select: { publicId: true, email: true },
  });

  return {
    id: company.id,
    publicId: company.publicId,
    owner: { ...owner, password: PASSWORD },
    staff: { ...staff, password: PASSWORD },
  };
}

/** Reset and seed two companies (A and B) for tenant-isolation tests. */
export async function seedFixtures() {
  await resetDb();
  const companyA = await seedCompany('Company A');
  const companyB = await seedCompany('Company B');
  return { companyA, companyB };
}

export async function countAuditRows(tableName: string, action: string): Promise<number> {
  return prisma.auditLog.count({ where: { tableName, action } });
}
