/**
 * One-time setup (FR-1.1): create the company and the first Owner account.
 *
 * There is no public sign-up. Run this once, after the schema + seed are
 * loaded, to bootstrap the business:
 *
 *   npm run setup
 *
 * It reads values from the environment, or prompts for anything missing:
 *   COMPANY_NAME, COMPANY_STATE_CODE (GST code, e.g. 36 = Telangana),
 *   OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD
 *
 * What it does, in one transaction:
 *   1. Creates the company.
 *   2. Copies the seed's template roles (Owner/Manager/Sales/Staff) and their
 *      permissions into company-scoped roles.
 *   3. Creates the first user with the Owner role.
 *
 * Safe guard: refuses to run if the owner email already exists.
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function ask(question: string, { secret = false } = {}): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    if (secret) stdout.write('(note: input is visible)\n');
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

/** Get a value from env, else prompt until it passes `validate`. */
async function resolve(
  envKey: string,
  prompt: string,
  validate: (v: string) => string | null,
  opts?: { secret?: boolean },
): Promise<string> {
  let value = process.env[envKey]?.trim() ?? '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (value) {
      const error = validate(value);
      if (!error) return value;
      console.error(`  ✗ ${error}`);
    }
    value = await ask(prompt, opts);
  }
}

const required = (label: string) => (v: string) => (v.length ? null : `${label} is required`);

async function main() {
  console.log('\nVarna UPVC — first-time setup\n');

  const templateRoles = await prisma.role.findMany({
    where: { companyId: null },
    select: { name: true, description: true, isSystem: true, permissions: { select: { permissionId: true } } },
  });
  if (templateRoles.length === 0) {
    throw new Error('No template roles found. Load upvc_launch_seed.sql first.');
  }
  if (!templateRoles.some((r) => r.name === 'Owner')) {
    throw new Error('Template role "Owner" is missing from the seed.');
  }

  const email = (
    await resolve('OWNER_EMAIL', 'Owner email: ', (v) => (isEmail(v) ? null : 'Enter a valid email'))
  ).toLowerCase();

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    throw new Error(`A user with email ${email} already exists. Setup has already been run.`);
  }

  const companyName = await resolve('COMPANY_NAME', 'Company name: ', required('Company name'));
  const stateCode = await resolve('COMPANY_STATE_CODE', 'Company GST state code (e.g. 36): ', (v) =>
    /^[0-9]{2}$/.test(v) ? null : 'Enter a 2-digit GST state code',
  );
  const state = await prisma.indianState.findUnique({ where: { code: stateCode } });
  if (!state) throw new Error(`State code ${stateCode} not found. Load the seed's state list.`);

  const ownerName = await resolve('OWNER_NAME', 'Owner full name: ', required('Owner name'));
  const password = await resolve(
    'OWNER_PASSWORD',
    'Owner password (min 8 chars): ',
    (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
    { secret: true },
  );
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: companyName, stateCode } });

    let ownerRoleId: bigint | null = null;
    for (const template of templateRoles) {
      const role = await tx.role.create({
        data: {
          companyId: company.id,
          name: template.name,
          description: template.description,
          isSystem: template.isSystem,
        },
      });
      if (template.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: template.permissions.map((p) => ({ roleId: role.id, permissionId: p.permissionId })),
        });
      }
      if (template.name === 'Owner') ownerRoleId = role.id;
    }

    await tx.user.create({
      data: {
        companyId: company.id,
        name: ownerName,
        email,
        passwordHash,
        userType: 'fabricator',
        roleId: ownerRoleId,
      },
    });
  });

  console.log(`\n✓ Company "${companyName}" created.`);
  console.log(`✓ Owner account ready. Sign in with: ${email}\n`);
}

main()
  .catch((error) => {
    console.error(`\n✗ Setup failed: ${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
