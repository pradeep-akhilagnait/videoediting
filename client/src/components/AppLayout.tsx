import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth';

type NavItem = { to: string; label: string; permission?: string; icon: ReactNode };

// Minimal inline line icons (no icon dependency), 18×18, currentColor stroke.
const svg = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d.split('|').map((path, i) => (
      <path key={i} d={path} />
    ))}
  </svg>
);

const ICON = {
  home: svg('M3 11l9-7 9 7|M5 10v10h14V10'),
  doc: svg('M7 3h7l4 4v14H7z|M14 3v4h4'),
  cart: svg('M3 4h2l2 12h11l2-8H6|M9 20a1 1 0 100-2 1 1 0 000 2|M17 20a1 1 0 100-2 1 1 0 000 2'),
  receipt: svg('M6 3h12v18l-3-2-3 2-3-2-3 2z|M9 8h6|M9 12h6'),
  shield: svg('M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z'),
  design: svg('M3 17l6-6 4 4 8-8|M14 7h5v5'),
  folder: svg('M3 6h6l2 2h10v11H3z'),
  users: svg('M8 11a3 3 0 100-6 3 3 0 000 6|M2 20a6 6 0 0112 0|M16 7a3 3 0 010 6|M22 20a6 6 0 00-6-6'),
  calc: svg('M6 3h12v18H6z|M9 7h6|M9 11h.01M12 11h.01M15 11h.01|M9 15h.01M12 15h.01M15 15h3v3'),
  sliders: svg('M4 6h10|M18 6h2|M4 12h4|M12 12h8|M4 18h12|M18 18h2'),
  gear: svg('M12 15a3 3 0 100-6 3 3 0 000 6|M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1L16 3H8l-.9 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L3 11a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1L8 21h8l.9-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5a7 7 0 00.1-1z'),
} as const;

const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: ICON.home },
  { to: '/proforma', label: 'Proforma Invoice', permission: 'proforma.view', icon: ICON.doc },
  { to: '/orders', label: 'My Orders', permission: 'order.view', icon: ICON.cart },
  { to: '/invoices', label: 'Tax Invoices', permission: 'invoice.view', icon: ICON.receipt },
  { to: '/warranty', label: 'Warranty Cards', permission: 'warranty.view', icon: ICON.shield },
  { to: '/design', label: 'Create Your Design', permission: 'design.view', icon: ICON.design },
  { to: '/projects', label: 'My Projects', permission: 'project.view', icon: ICON.folder },
  { to: '/customers', label: 'Customers', permission: 'customer.view', icon: ICON.users },
  { to: '/estimates', label: 'Estimates', permission: 'estimate.view', icon: ICON.calc },
  { to: '/masters', label: 'Masters', permission: 'company.manage', icon: ICON.sliders },
  { to: '/settings', label: 'Settings', permission: 'user.manage', icon: ICON.gear },
];

export const AppLayout = () => {
  const { user, companyName, can, logout } = useAuth();
  const items = NAV.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="layout">
      <header className="topbar">
        <strong className="company">{companyName ?? 'Varna UPVC'}</strong>
        <div className="spacer" />
        <span className="muted role-chip">{user?.role}</span>
        <button className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>
      <div className="layout-body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
              >
                <span className="side-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
