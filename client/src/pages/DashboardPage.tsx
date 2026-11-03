import { useAuth } from '@/auth/use-auth';

/**
 * Placeholder home/dashboard. The real menu (Home catalogue, My Projects,
 * Create Your Design, Estimates, etc. — REQUIREMENTS §0) is built on top of
 * this shell section by section.
 */
export const DashboardPage = () => {
  const { user, permissions, logout } = useAuth();

  return (
    <div className="page">
      <header className="topbar">
        <strong>Varna UPVC</strong>
        <div className="spacer" />
        <span className="muted">{user?.role}</span>
        <button className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <main className="card">
        <h2>You are signed in</h2>
        <p className="muted">
          This is the application shell. Feature sections are added onto it one at a time.
        </p>
        <h3>Your permissions ({permissions.size})</h3>
        <ul className="perm-list">
          {[...permissions].sort().map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};
