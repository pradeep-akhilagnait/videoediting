import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/auth/use-auth';
import { listProjects, createProject } from '@/lib/projects';
import { ProjectFormDialog } from './ProjectFormDialog';

const PAGE_SIZE = 10;

export const ProjectsPage = () => {
  const { can } = useAuth();
  const canManage = can('project.manage');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ['projects', { q: search, page }],
    queryFn: () => listProjects({ q: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
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
          <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
            <div className="project-card-head">
              <strong>{p.name}</strong>
              <span className={`status status-${p.status}`}>{p.status}</span>
            </div>
            <div className="muted">{p.customer.name}</div>
            {p.siteCity && <div className="muted small">{p.siteCity}</div>}
            <div className="small muted">
              {new Date(p.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </Link>
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
    </div>
  );
};
