import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/use-auth';
import {
  getProject,
  deleteProject,
  updateProject,
  listBoms,
  createBom,
  renameBom,
  deleteBom,
} from '@/lib/projects';
import { ProjectFormDialog } from './ProjectFormDialog';

type Tab = 'boms' | 'quotations' | 'pi' | 'orders';

const TABS: { key: Tab; label: string }[] = [
  { key: 'boms', label: 'My BOMs' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'pi', label: 'Proforma' },
  { key: 'orders', label: 'Orders' },
];

export const ProjectDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const canManage = can('project.manage');
  const canDelete = can('project.delete');
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('boms');
  const [editing, setEditing] = useState(false);
  const [newBomName, setNewBomName] = useState('');

  const projectQuery = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const bomsQuery = useQuery({ queryKey: ['project', id, 'boms'], queryFn: () => listBoms(id) });

  const refetchBoms = () => queryClient.invalidateQueries({ queryKey: ['project', id, 'boms'] });

  const addBom = useMutation({
    mutationFn: (name: string) => createBom(id, name),
    onSuccess: () => {
      setNewBomName('');
      refetchBoms();
    },
  });
  const renameBomMut = useMutation({
    mutationFn: (vars: { bomId: string; name: string }) => renameBom(id, vars.bomId, vars.name),
    onSuccess: refetchBoms,
  });
  const deleteBomMut = useMutation({
    mutationFn: (bomId: string) => deleteBom(id, bomId),
    onSuccess: refetchBoms,
  });
  const updateProjectMut = useMutation({
    mutationFn: (body: Parameters<typeof updateProject>[1]) => updateProject(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });
  const deleteProjectMut = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => navigate('/projects', { replace: true }),
  });

  const project = projectQuery.data;

  if (projectQuery.isLoading) return <div className="page-content">Loading…</div>;
  if (projectQuery.isError || !project)
    return (
      <div className="page-content">
        <div className="alert">Project not found.</div>
        <Link to="/projects">← Back to projects</Link>
      </div>
    );

  return (
    <div className="page-content">
      <Link to="/projects" className="back-link">
        ← Back to projects
      </Link>

      <div className="page-head">
        <div>
          <h1>{project.name}</h1>
          <div className="muted">
            {project.customer.name}
            {project.siteCity ? ` · ${project.siteCity}` : ''}{' '}
            <span className={`status status-${project.status}`}>{project.status}</span>
          </div>
        </div>
        <div className="head-actions">
          {canManage && (
            <button className="ghost" onClick={() => setEditing(true)}>
              Edit project
            </button>
          )}
          {canDelete && (
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm(`Delete project "${project.name}"? It can be restored later.`))
                  deleteProjectMut.mutate();
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'boms' && (
        <div className="card">
          {canManage && (
            <form
              className="inline-add"
              onSubmit={(e) => {
                e.preventDefault();
                if (newBomName.trim()) addBom.mutate(newBomName.trim());
              }}
            >
              <input
                placeholder="New BOM name (e.g. 1st–4th floor)"
                value={newBomName}
                onChange={(e) => setNewBomName(e.target.value)}
              />
              <button type="submit" disabled={addBom.isPending || !newBomName.trim()}>
                Add BOM
              </button>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>BOM</th>
                <th>Designs</th>
                {canManage && <th aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {bomsQuery.data?.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.designCount}</td>
                  {canManage && (
                    <td className="row-actions">
                      <button
                        className="link"
                        onClick={() => {
                          const name = prompt('Rename BOM', b.name);
                          if (name && name.trim()) renameBomMut.mutate({ bomId: b.id, name: name.trim() });
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="link danger"
                        onClick={() => {
                          if (confirm(`Delete BOM "${b.name}"?`)) deleteBomMut.mutate(b.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {bomsQuery.data && bomsQuery.data.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 3 : 2} className="empty">
                    No BOMs yet. Add one to start creating designs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="muted small">
            Opening a BOM to draw designs (and cloning a BOM with its designs) arrives with the
            Design Studio.
          </p>
        </div>
      )}

      {tab !== 'boms' && (
        <div className="card empty">
          {TABS.find((t) => t.key === tab)?.label} will appear here once that section is built.
        </div>
      )}

      {editing && (
        <ProjectFormDialog
          initial={project}
          onClose={() => setEditing(false)}
          onSubmit={(input) => {
            const { customerId: _omit, ...rest } = input;
            return updateProjectMut.mutateAsync(rest).then(() => undefined);
          }}
        />
      )}
    </div>
  );
};
