import { useAuth } from '@/auth/use-auth';

/**
 * Home/dashboard. The top bar and navigation live in AppLayout; this is just
 * the landing content. Real summary widgets are added as features land.
 */
export const DashboardPage = () => {
  const { permissions } = useAuth();

  return (
    <div className="page-content">
      <div className="card">
        <h2>Welcome</h2>
        <p className="muted">
          This is the application shell. Use the menu above to navigate. Feature sections are
          added one at a time.
        </p>
        <details>
          <summary>Your permissions ({permissions.size})</summary>
          <ul className="perm-list">
            {[...permissions].sort().map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
};
