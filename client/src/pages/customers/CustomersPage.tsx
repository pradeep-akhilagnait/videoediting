import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/auth/use-auth';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CustomerInput,
} from '@/lib/customers';
import { CustomerFormDialog } from './CustomerFormDialog';

const PAGE_SIZE = 10;

export const CustomersPage = () => {
  const { can } = useAuth();
  const canManage = can('customer.manage');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ['customers', { q: search, page }],
    queryFn: () => listCustomers({ q: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers'] });

  const createMut = useMutation({ mutationFn: createCustomer, onSuccess: invalidate });
  const updateMut = useMutation({
    mutationFn: (vars: { id: string; body: CustomerInput }) => updateCustomer(vars.id, vars.body),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({ mutationFn: deleteCustomer, onSuccess: invalidate });

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const onDelete = (c: Customer) => {
    if (confirm(`Delete customer "${c.name}"? This can be restored later.`)) {
      deleteMut.mutate(c.id);
    }
  };

  return (
    <div className="page-content">
      <div className="page-head">
        <h1>Customers</h1>
        {canManage && (
          <button onClick={() => setCreating(true)}>+ New customer</button>
        )}
      </div>

      <input
        className="search"
        placeholder="Search by name, company, mobile or email…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {query.isError && <div className="alert">Could not load customers.</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Mobile</th>
              <th>City</th>
              <th>GSTIN</th>
              {canManage && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.companyName ?? '—'}</td>
                <td>{c.mobile ?? '—'}</td>
                <td>{c.city ?? '—'}</td>
                <td>{c.gstin ?? '—'}</td>
                {canManage && (
                  <td className="row-actions">
                    <button className="link" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                    <button className="link danger" onClick={() => onDelete(c)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="empty">
                  {search ? 'No customers match your search.' : 'No customers yet. Add your first one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="pager">
          <span className="muted">
            {data.total} customer{data.total === 1 ? '' : 's'} · page {page} of {totalPages}
          </span>
          <div className="pager-buttons">
            <button className="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {creating && (
        <CustomerFormDialog
          onClose={() => setCreating(false)}
          onSubmit={(input) => createMut.mutateAsync(input).then(() => undefined)}
        />
      )}
      {editing && (
        <CustomerFormDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) =>
            updateMut.mutateAsync({ id: editing.id, body: input }).then(() => undefined)
          }
        />
      )}
    </div>
  );
};
