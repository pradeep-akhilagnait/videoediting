import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { seedFixtures, countAuditRows, type SeededCompany } from './helpers/db.js';
import { request, login, bearer } from './helpers/app.js';

let a: SeededCompany;
let b: SeededCompany;
let ownerA: string;
let staffA: string;
let ownerB: string;

const validCustomer = {
  name: 'Acme Traders',
  mobile: '9876543210',
  gstin: '36ABCDE1234F1Z5',
  stateCode: '36',
  pincode: '500001',
};

beforeEach(async () => {
  const f = await seedFixtures();
  a = f.companyA;
  b = f.companyB;
  ownerA = await login(a.owner.email, a.owner.password);
  staffA = await login(a.staff.email, a.staff.password);
  ownerB = await login(b.owner.email, b.owner.password);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Customers API', () => {
  it('creates, lists, updates and soft-deletes (happy path) + writes audit rows', async () => {
    // create
    const created = await request().post('/api/customers').set(bearer(ownerA)).send(validCustomer);
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body.name).toBe('Acme Traders');
    const id = created.body.id as string;

    // appears in list
    const listed = await request().get('/api/customers').set(bearer(ownerA));
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.items[0].id).toBe(id);

    // update
    const updated = await request()
      .put(`/api/customers/${id}`)
      .set(bearer(ownerA))
      .send({ ...validCustomer, name: 'Acme Traders Pvt Ltd' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Acme Traders Pvt Ltd');

    // soft delete
    const deleted = await request().delete(`/api/customers/${id}`).set(bearer(ownerA));
    expect(deleted.status).toBe(204);

    // no longer listed, but row still exists (soft delete)
    const afterDelete = await request().get('/api/customers').set(bearer(ownerA));
    expect(afterDelete.body.total).toBe(0);
    const row = await prisma.customer.findFirst({ where: { publicId: id } });
    expect(row).not.toBeNull();
    expect(row?.deletedAt).not.toBeNull();

    // audit rows for each action
    expect(await countAuditRows('customers', 'insert')).toBe(1);
    expect(await countAuditRows('customers', 'update')).toBe(1);
    expect(await countAuditRows('customers', 'delete')).toBe(1);
  });

  it('rejects a bad GSTIN and a bad mobile with 400 field errors', async () => {
    const res = await request()
      .post('/api/customers')
      .set(bearer(ownerA))
      .send({ name: 'Bad Co', gstin: '123', mobile: 'not-a-number' });
    expect(res.status).toBe(400);
    const fields = (res.body.error.details as { field: string }[]).map((d) => d.field);
    expect(fields).toContain('gstin');
    expect(fields).toContain('mobile');
  });

  it('denies a Staff (view-only) user from deleting with 403', async () => {
    const created = await request().post('/api/customers').set(bearer(ownerA)).send(validCustomer);
    const id = created.body.id as string;

    const res = await request().delete(`/api/customers/${id}`).set(bearer(staffA));
    expect(res.status).toBe(403);

    // and the record is untouched
    const row = await prisma.customer.findFirst({ where: { publicId: id } });
    expect(row?.deletedAt).toBeNull();
  });

  it('isolates tenants: another company cannot see or touch the record (404)', async () => {
    const created = await request().post('/api/customers').set(bearer(ownerA)).send(validCustomer);
    const id = created.body.id as string;

    expect((await request().get(`/api/customers/${id}`).set(bearer(ownerB))).status).toBe(404);
    expect(
      (await request().put(`/api/customers/${id}`).set(bearer(ownerB)).send(validCustomer)).status,
    ).toBe(404);
    expect((await request().delete(`/api/customers/${id}`).set(bearer(ownerB))).status).toBe(404);

    // Company B's own list stays empty
    const listB = await request().get('/api/customers').set(bearer(ownerB));
    expect(listB.body.total).toBe(0);
  });
});
