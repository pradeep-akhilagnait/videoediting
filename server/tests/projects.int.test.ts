import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { seedFixtures, countAuditRows, type SeededCompany } from './helpers/db.js';
import { request, login, bearer } from './helpers/app.js';

let a: SeededCompany;
let ownerA: string;
let staffA: string;
let ownerB: string;
let customerId: string; // a customer in company A to attach projects to

async function makeCustomer(token: string): Promise<string> {
  const res = await request().post('/api/customers').set(bearer(token)).send({ name: 'Site Owner' });
  return res.body.id as string;
}

beforeEach(async () => {
  const f = await seedFixtures();
  a = f.companyA;
  ownerA = await login(a.owner.email, a.owner.password);
  staffA = await login(a.staff.email, a.staff.password);
  ownerB = await login(f.companyB.owner.email, f.companyB.owner.password);
  customerId = await makeCustomer(ownerA);
});

afterAll(async () => {
  await prisma.$disconnect();
});

const project = () => ({ customerId, name: 'Green Villa', status: 'active', siteCity: 'Hyderabad' });

describe('Projects API', () => {
  it('creates, lists, updates and soft-deletes (happy path) + writes audit rows', async () => {
    const created = await request().post('/api/projects').set(bearer(ownerA)).send(project());
    expect(created.status).toBe(201);
    expect(created.body.customer.name).toBe('Site Owner');
    const id = created.body.id as string;

    const listed = await request().get('/api/projects').set(bearer(ownerA));
    expect(listed.body.total).toBe(1);
    expect(listed.body.items[0].id).toBe(id);

    const updated = await request()
      .put(`/api/projects/${id}`)
      .set(bearer(ownerA))
      .send({ name: 'Green Villa Phase 2', status: 'won' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Green Villa Phase 2');
    expect(updated.body.status).toBe('won');

    const deleted = await request().delete(`/api/projects/${id}`).set(bearer(ownerA));
    expect(deleted.status).toBe(204);

    const afterDelete = await request().get('/api/projects').set(bearer(ownerA));
    expect(afterDelete.body.total).toBe(0);

    expect(await countAuditRows('projects', 'insert')).toBe(1);
    expect(await countAuditRows('projects', 'update')).toBe(1);
    expect(await countAuditRows('projects', 'delete')).toBe(1);
  });

  it('rejects a missing name and an unknown customer', async () => {
    const noName = await request()
      .post('/api/projects')
      .set(bearer(ownerA))
      .send({ customerId, status: 'active' });
    expect(noName.status).toBe(400);

    const badCustomer = await request()
      .post('/api/projects')
      .set(bearer(ownerA))
      .send({ customerId: '00000000-0000-0000-0000-000000000000', name: 'X' });
    expect(badCustomer.status).toBe(400);
  });

  it('denies a Staff user from deleting with 403', async () => {
    const created = await request().post('/api/projects').set(bearer(ownerA)).send(project());
    const id = created.body.id as string;

    const res = await request().delete(`/api/projects/${id}`).set(bearer(staffA));
    expect(res.status).toBe(403);

    const row = await prisma.project.findFirst({ where: { publicId: id } });
    expect(row?.deletedAt).toBeNull();
  });

  it('isolates tenants: another company gets 404', async () => {
    const created = await request().post('/api/projects').set(bearer(ownerA)).send(project());
    const id = created.body.id as string;

    expect((await request().get(`/api/projects/${id}`).set(bearer(ownerB))).status).toBe(404);
    expect((await request().delete(`/api/projects/${id}`).set(bearer(ownerB))).status).toBe(404);
    expect((await request().get('/api/projects').set(bearer(ownerB))).body.total).toBe(0);
  });

  it('manages BOMs under a project and reports design counts', async () => {
    const created = await request().post('/api/projects').set(bearer(ownerA)).send(project());
    const id = created.body.id as string;

    const addBom = await request()
      .post(`/api/projects/${id}/boms`)
      .set(bearer(ownerA))
      .send({ name: 'Ground floor' });
    expect(addBom.status).toBe(201);
    expect(addBom.body.designCount).toBe(0);

    const boms = await request().get(`/api/projects/${id}/boms`).set(bearer(ownerA));
    expect(boms.body).toHaveLength(1);
    expect(boms.body[0].name).toBe('Ground floor');
  });
});
