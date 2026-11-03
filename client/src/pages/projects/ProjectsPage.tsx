import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/auth/use-auth';
import { listProjects, createProject, updateProject, getProject } from '@/lib/projects';
import { ProjectFormDialog } from './ProjectFormDialog';

const PAGE_SIZE = 10;

export const ProjectsPage = () => {
  const { can } = useAuth();
  const canManage = can('project.manage');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['projects', { q: search, page }],
    queryFn: () => listProjects({ q: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  // Fetch the full project only when the user opens the edit dialog from a card.
  const editQuery = useQuery({
    queryKey: ['project', editingId],
    queryFn: () => getProject(editingId!),
    enabled: Boolean(editingId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });
  const createMut = useMutation({ mutationFn: createProject, onSuccess: invalidate });
  const updateMut = useMutation({
    mutationFn: (vars: { id: string; body: Parameters<typeof updateProject>[1] }) =>
      updateProject(vars.id, vars.body),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="page-content">
      <div className="page-head">
        <h1>My Projects</h1>
        {canManage && <button onClick={() => setCreating(true)}>+ New project</button>}
      </div>

      <input
        className="search"
        placeholder="Search by project or customer name…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {query.isError && <div className="alert">Could not load projects.</div>}

      <div className="card-grid">
        {data?.items.map((p) => (
          <div key={p.id} className="project-card">
            <button className="project-card-main" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-head">
                <strong>{p.name}</strong>
                <span className={`status status-${p.status}`}>{p.status}</span>
              </div>
              <div className="project-field">
                <span className="muted small">Customer</span>
                <span>{p.customer.name}</span>
              </div>
              <div className="project-field">
                <span className="muted small">Location</span>
                <span>{p.siteCity ?? '—'}</span>
              </div>
            </button>
            <div className="project-card-foot">
              {canManage ? (
                <button className="link" onClick={() => setEditingId(p.id)}>
                  Edit project details
                </button>
              ) : (
                <span />
              )}
              <button
                className="open-arrow"
                aria-label={`Open ${p.name}`}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <div className="card empty">
          {search ? 'No projects match your search.' : 'No projects yet. Create your first one.'}
        </div>
      )}

      {data && data.total > 0 && (
        <div className="pager">
          <span className="muted">
            {data.total} project{data.total === 1 ? '' : 's'} · page {page} of {totalPages}
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
        <ProjectFormDialog
          onClose={() => setCreating(false)}
          onSubmit={(input) => createMut.mutateAsync(input).then(() => undefined)}
        />
      )}
      {editingId && editQuery.data && (
        <ProjectFormDialog
          initial={editQuery.data}
          onClose={() => setEditingId(null)}
          onSubmit={(input) => {
            const { customerId: _omit, ...rest } = input;
            return updateMut.mutateAsync({ id: editingId, body: rest }).then(() => undefined);
          }}
        />
      )}
    </div>
  );
};
