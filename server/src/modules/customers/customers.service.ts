import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { recordAudit } from '../../lib/audit.js';
import type { CustomerBody, ListQuery } from './customers.schema.js';

/** The actor + tenant for every call, taken from the authenticated session. */
export type Actor = { companyId: bigint; userId: bigint };

/** Public shape returned to the client — internal BigInt ids never leak. */
export type CustomerDto = {
  id: string; // public_id
  name: string;
  companyName: string | null;
  email: string | null;
  mobile: string | null;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  pincode: string | null;
  gstin: string | null;
  createdAt: string;
};

type CustomerRow = {
  publicId: string;
  name: string;
  companyName: string | null;
  email: string | null;
  mobile: string | null;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  pincode: string | null;
  gstin: string | null;
  createdAt: Date;
};

const select = {
  publicId: true,
  name: true,
  companyName: true,
  email: true,
  mobile: true,
  addressLine: true,
  city: true,
  stateCode: true,
  pincode: true,
  gstin: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

const toDto = (c: CustomerRow): CustomerDto => ({
  id: c.publicId,
  name: c.name,
  companyName: c.companyName,
  email: c.email,
  mobile: c.mobile,
  addressLine: c.addressLine,
  city: c.city,
  stateCode: c.stateCode,
  pincode: c.pincode,
  gstin: c.gstin,
  createdAt: c.createdAt.toISOString(),
});

/** Paginated, searchable list of live customers for the tenant (FR-2.1, FR-14.3). */
export const listCustomers = async (actor: Actor, query: ListQuery) => {
  const where: Prisma.CustomerWhereInput = {
    companyId: actor.companyId,
    deletedAt: null,
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { companyName: { contains: query.q } },
            { mobile: { contains: query.q } },
            { email: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { items: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
};

/** Internal lookup that enforces the tenant boundary. Throws 404 if not found. */
const findOwned = async (actor: Actor, publicId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { publicId, companyId: actor.companyId, deletedAt: null },
  });
  if (!customer) throw notFound('Customer not found');
  return customer;
};

export const getCustomer = async (actor: Actor, publicId: string): Promise<CustomerDto> =>
  toDto(await findOwned(actor, publicId));

export const createCustomer = async (actor: Actor, body: CustomerBody): Promise<CustomerDto> => {
  const customer = await prisma.customer.create({
    data: { companyId: actor.companyId, createdBy: actor.userId, ...body },
    select,
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'customers',
    action: 'insert',
    after: body,
  });
  return toDto(customer);
};

export const updateCustomer = async (
  actor: Actor,
  publicId: string,
  body: CustomerBody,
): Promise<CustomerDto> => {
  const existing = await findOwned(actor, publicId);
  const updated = await prisma.customer.update({
    where: { id: existing.id },
    data: { ...body, updatedBy: actor.userId },
    select,
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'customers',
    recordId: existing.id,
    action: 'update',
    before: existing,
    after: body,
  });
  return toDto(updated);
};

/** Soft delete (FR-14.2): set deleted_at/by; the row is kept and restorable. */
export const deleteCustomer = async (actor: Actor, publicId: string): Promise<void> => {
  const existing = await findOwned(actor, publicId);
  await prisma.customer.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), deletedBy: actor.userId },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'customers',
    recordId: existing.id,
    action: 'delete',
    before: existing,
  });
};
