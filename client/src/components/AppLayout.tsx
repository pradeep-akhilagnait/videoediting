import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth';

type NavItem = { to: string; label: string; permission?: string };

const NAV: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/customers', label: 'Customers', permission: 'customer.view' },
];

export const AppLayout = () => {
  const { user, can, logout } = useAuth();
  const items = NAV.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong className="brand">Varna UPVC</strong>
        <nav className="nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <span className="muted">{user?.role}</span>
        <button className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
