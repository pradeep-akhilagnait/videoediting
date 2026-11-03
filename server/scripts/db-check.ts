/**
 * Database doctor:  npm run db:check
 *
 * Prints exactly what the server sees, so connection problems are obvious:
 *   - which .env file was loaded (and whether it exists)
 *   - the connection it will use, with the password masked
 *   - whether MySQL accepts the credentials
 *   - whether the target database and its tables exist
 *   - whether the seed + setup have been run (states, permissions, roles, users)
 *
 * It never prints your password. Read-only; it changes nothing.
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string) => console.log(`  ✗ ${m}`);
const info = (m: string) => console.log(`    ${m}`);

function describeConnection(raw: string | undefined) {
  console.log('\n1) Environment');
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) ok(`.env found: ${envPath}`);
  else bad(`.env NOT found at ${envPath} (running from the wrong folder?)`);

  if (!raw) {
    bad('DATABASE_URL is not set.');
    return null;
  }
  try {
    const u = new URL(raw);
    console.log('\n2) Connection (from DATABASE_URL)');
    ok(`host:     ${u.hostname}`);
    ok(`port:     ${u.port || '3306'}`);
    ok(`user:     ${decodeURIComponent(u.username)}`);
    ok(`database: ${u.pathname.replace(/^\//, '') || '(none given)'}`);
    const pw = u.password;
    if (!pw) bad('password: (empty)  <-- MySQL root almost always has a password');
    else ok(`password: ${'*'.repeat(Math.min(decodeURIComponent(pw).length, 12))} (${decodeURIComponent(pw).length} chars)`);
    return u;
  } catch {
    bad(`DATABASE_URL is not a valid URL: ${raw}`);
    return null;
  }
}

async function main() {
  console.log('\nVarna UPVC — database check');
  const url = describeConnection(process.env.DATABASE_URL);
  if (!url) {
    console.log('\nFix DATABASE_URL in .env, then run this again.\n');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  console.log('\n3) Can we connect?');
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok('MySQL accepted the connection and credentials.');
  } catch (error) {
    bad('Could not connect.');
    const msg = error instanceof Error ? error.message : String(error);
    if (/P1000|Authentication failed|Access denied/i.test(msg))
      info('Reason: wrong username or password. Use the password that works in MySQL Workbench.');
    else if (/P1001|Can't reach|ECONNREFUSED/i.test(msg))
      info("Reason: MySQL isn't reachable at that host/port. Is the MySQL service running?");
    else if (/P1003|Unknown database|does not exist/i.test(msg))
      info(`Reason: no database named "${url.pathname.replace(/^\//, '')}". Check the name in Workbench.`);
    else info(msg.split('\n')[0] ?? msg);
    console.log();
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  console.log('\n4) Is the schema + seed loaded?');
  try {
    const [states, permissions, templateRoles, users, companies] = await Promise.all([
      prisma.indianState.count(),
      prisma.permission.count(),
      prisma.role.count({ where: { companyId: null } }),
      prisma.user.count(),
      prisma.company.count(),
    ]);

    states > 0 ? ok(`indian_states: ${states} rows`) : bad('indian_states is empty — run upvc_launch_seed.sql');
    permissions > 0 ? ok(`permissions: ${permissions} rows`) : bad('permissions is empty — run upvc_launch_seed.sql');
    templateRoles > 0
      ? ok(`template roles: ${templateRoles}`)
      : bad('no template roles — run upvc_launch_seed.sql');

    console.log('\n5) Has setup been run?');
    if (companies > 0 && users > 0) {
      ok(`companies: ${companies}, users: ${users} — setup already done, you can log in.`);
    } else {
      info('No company/user yet. Run:  npm run setup');
    }
    console.log('\nAll good where you see checks. ✓\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/P2021|doesn't exist|Unknown column|Table .* doesn't exist/i.test(msg)) {
      bad('Connected, but the expected tables are missing.');
      info('This database exists but does not have the app schema. Either the name is wrong');
      info('or upvc_launch_schema_mysql8.sql was not loaded into THIS database.');
    } else {
      bad(msg.split('\n')[0] ?? msg);
    }
    console.log();
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
