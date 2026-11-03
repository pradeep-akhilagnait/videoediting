import { api } from './api';
import type { Paged } from './customers';

export const PROJECT_STATUSES = ['active', 'won', 'lost', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectListItem = {
  id: string;
  name: string;
  status: ProjectStatus;
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

export type ProjectInput = {
  customerId: string;
  name: string;
  siteAddress?: string;
  siteCity?: string;
  siteStateCode?: string;
  shippingAddress?: string;
  status: ProjectStatus;
  notes?: string;
};

export type Bom = {
  id: string;
  name: string;
  sortOrder: number;
  designCount: number;
  createdAt: string;
};

export const listProjects = (params: { q?: string; page: number; pageSize: number }) => {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  search.set('page', String(params.page));
  search.set('pageSize', String(params.pageSize));
  return api<Paged<ProjectListItem>>(`/projects?${search.toString()}`);
};

export const getProject = (id: string) => api<ProjectDetail>(`/projects/${id}`);
export const createProject = (body: ProjectInput) =>
  api<ProjectDetail>('/projects', { method: 'POST', body });
export const updateProject = (id: string, body: Omit<ProjectInput, 'customerId'>) =>
  api<ProjectDetail>(`/projects/${id}`, { method: 'PUT', body });
export const deleteProject = (id: string) => api<void>(`/projects/${id}`, { method: 'DELETE' });

export const listBoms = (projectId: string) => api<Bom[]>(`/projects/${projectId}/boms`);
export const createBom = (projectId: string, name: string) =>
  api<Bom>(`/projects/${projectId}/boms`, { method: 'POST', body: { name } });
export const renameBom = (projectId: string, bomId: string, name: string) =>
  api<void>(`/projects/${projectId}/boms/${bomId}`, { method: 'PUT', body: { name } });
export const deleteBom = (projectId: string, bomId: string) =>
  api<void>(`/projects/${projectId}/boms/${bomId}`, { method: 'DELETE' });
