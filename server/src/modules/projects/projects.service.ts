import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { recordAudit } from '../../lib/audit.js';
import type { BomBody, ListQuery, ProjectBody, ProjectUpdate } from './projects.schema.js';

export type Actor = { companyId: bigint; userId: bigint };

export type ProjectListItem = {
  id: string;
  name: string;
  status: string;
  siteCity: string | null;
  customer: { id: string; name: string };
  createdAt: string;
};

export type ProjectDetail = ProjectListItem & {
  siteAddress: string | null;
  siteStateCode: string | null;
  shippingAddress: string | null;
  notes: string | null;
};

export type BomItem = {
  id: string;
  name: string;
  sortOrder: number;
  designCount: number;
  createdAt: string;
};

const listSelect = {
  publicId: true,
  name: true,
  status: true,
  siteCity: true,
  createdAt: true,
  customer: { select: { publicId: true, name: true } },
} satisfies Prisma.ProjectSelect;

type ListRow = Prisma.ProjectGetPayload<{ select: typeof listSelect }>;

const toListItem = (p: ListRow): ProjectListItem => ({
  id: p.publicId,
  name: p.name,
  status: p.status,
  siteCity: p.siteCity,
  customer: { id: p.customer.publicId, name: p.customer.name },
  createdAt: p.createdAt.toISOString(),
});

/** Resolve a customer public id to an internal id within the tenant. */
const resolveCustomerId = async (actor: Actor, customerPublicId: string): Promise<bigint> => {
  const customer = await prisma.customer.findFirst({
    where: { publicId: customerPublicId, companyId: actor.companyId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw badRequest('Customer not found');
  return customer.id;
};

export const listProjects = async (actor: Actor, query: ListQuery) => {
  const where: Prisma.ProjectWhereInput = {
    companyId: actor.companyId,
    deletedAt: null,
    ...(query.q
      ? { OR: [{ name: { contains: query.q } }, { customer: { name: { contains: query.q } } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return { items: rows.map(toListItem), total, page: query.page, pageSize: query.pageSize };
};

const findOwned = async (actor: Actor, publicId: string) => {
  const project = await prisma.project.findFirst({
    where: { publicId, companyId: actor.companyId, deletedAt: null },
    include: { customer: { select: { publicId: true, name: true } } },
  });
  if (!project) throw notFound('Project not found');
  return project;
};

export const getProject = async (actor: Actor, publicId: string): Promise<ProjectDetail> => {
  const p = await findOwned(actor, publicId);
  return {
    id: p.publicId,
    name: p.name,
    status: p.status,
    siteCity: p.siteCity,
    siteAddress: p.siteAddress,
    siteStateCode: p.siteStateCode,
    shippingAddress: p.shippingAddress,
    notes: p.notes,
    customer: { id: p.customer.publicId, name: p.customer.name },
    createdAt: p.createdAt.toISOString(),
  };
};

export const createProject = async (actor: Actor, body: ProjectBody): Promise<ProjectDetail> => {
  const customerId = await resolveCustomerId(actor, body.customerId);
  const { customerId: _omit, ...rest } = body;
  const created = await prisma.project.create({
    data: { companyId: actor.companyId, customerId, createdBy: actor.userId, ...rest },
    select: { publicId: true },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'projects',
    action: 'insert',
    after: rest,
  });
  return getProject(actor, created.publicId);
};

export const updateProject = async (
  actor: Actor,
  publicId: string,
  body: ProjectUpdate,
): Promise<ProjectDetail> => {
  const existing = await findOwned(actor, publicId);
  await prisma.project.update({
    where: { id: existing.id },
    data: { ...body, updatedBy: actor.userId },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'projects',
    recordId: existing.id,
    action: 'update',
    after: body,
  });
  return getProject(actor, publicId);
};

export const deleteProject = async (actor: Actor, publicId: string): Promise<void> => {
  const existing = await findOwned(actor, publicId);
  await prisma.project.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), deletedBy: actor.userId },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'projects',
    recordId: existing.id,
    action: 'delete',
  });
};

// --- BOMs within a project -------------------------------------------------

/** Count live designs per BOM in one query (the designs table isn't modelled yet). */
const designCounts = async (bomIds: bigint[]): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (bomIds.length === 0) return counts;
  const rows = await prisma.$queryRaw<{ bom_id: bigint; cnt: bigint }[]>`
    SELECT bom_id, COUNT(*) AS cnt
    FROM designs
    WHERE deleted_at IS NULL AND bom_id IN (${Prisma.join(bomIds)})
    GROUP BY bom_id`;
  for (const r of rows) counts.set(r.bom_id.toString(), Number(r.cnt));
  return counts;
};

export const listBoms = async (actor: Actor, projectPublicId: string): Promise<BomItem[]> => {
  const project = await findOwned(actor, projectPublicId);
  const boms = await prisma.projectBom.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const counts = await designCounts(boms.map((b) => b.id));
  return boms.map((b) => ({
    id: b.publicId,
    name: b.name,
    sortOrder: b.sortOrder,
    designCount: counts.get(b.id.toString()) ?? 0,
    createdAt: b.createdAt.toISOString(),
  }));
};

const findOwnedBom = async (actor: Actor, projectId: bigint, bomPublicId: string) => {
  const bom = await prisma.projectBom.findFirst({
    where: { publicId: bomPublicId, projectId, companyId: actor.companyId, deletedAt: null },
  });
  if (!bom) throw notFound('BOM not found');
  return bom;
};

export const createBom = async (actor: Actor, projectPublicId: string, body: BomBody) => {
  const project = await findOwned(actor, projectPublicId);
  const last = await prisma.projectBom.findFirst({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const bom = await prisma.projectBom.create({
    data: {
      companyId: actor.companyId,
      projectId: project.id,
      name: body.name,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      createdBy: actor.userId,
    },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'project_boms',
    recordId: bom.id,
    action: 'insert',
    after: { name: body.name },
  });
  return { id: bom.publicId, name: bom.name, sortOrder: bom.sortOrder, designCount: 0, createdAt: bom.createdAt.toISOString() };
};

export const renameBom = async (
  actor: Actor,
  projectPublicId: string,
  bomPublicId: string,
  body: BomBody,
) => {
  const project = await findOwned(actor, projectPublicId);
  const bom = await findOwnedBom(actor, project.id, bomPublicId);
  await prisma.projectBom.update({ where: { id: bom.id }, data: { name: body.name, updatedBy: actor.userId } });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'project_boms',
    recordId: bom.id,
    action: 'update',
    before: { name: bom.name },
    after: { name: body.name },
  });
};

export const deleteBom = async (actor: Actor, projectPublicId: string, bomPublicId: string) => {
  const project = await findOwned(actor, projectPublicId);
  const bom = await findOwnedBom(actor, project.id, bomPublicId);
  await prisma.projectBom.update({
    where: { id: bom.id },
    data: { deletedAt: new Date(), deletedBy: actor.userId },
  });
  await recordAudit({
    companyId: actor.companyId,
    changedBy: actor.userId,
    tableName: 'project_boms',
    recordId: bom.id,
    action: 'delete',
  });
};
