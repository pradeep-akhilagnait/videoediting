import { api } from './api';

export type Customer = {
  id: string; // public id
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

export type CustomerInput = {
  name: string;
  companyName?: string;
  email?: string;
  mobile?: string;
  addressLine?: string;
  city?: string;
  stateCode?: string;
  pincode?: string;
  gstin?: string;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export const listCustomers = (params: { q?: string; page: number; pageSize: number }) => {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  search.set('page', String(params.page));
  search.set('pageSize', String(params.pageSize));
  return api<Paged<Customer>>(`/customers?${search.toString()}`);
};

export const createCustomer = (body: CustomerInput) =>
  api<Customer>('/customers', { method: 'POST', body });

export const updateCustomer = (id: string, body: CustomerInput) =>
  api<Customer>(`/customers/${id}`, { method: 'PUT', body });

export const deleteCustomer = (id: string) =>
  api<void>(`/customers/${id}`, { method: 'DELETE' });
