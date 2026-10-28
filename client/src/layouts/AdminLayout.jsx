import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully.', 'success');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <NavLink to="/admin" className="topbar-brand">
          <svg className="topbar-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span>BookLeaf</span>
        </NavLink>
        <span className="topbar-portal-label">Admin Console</span>
        <div className="topbar-spacer" />
        <div className="topbar-user">
          <span className="topbar-user-name">{user?.name}</span>
          <span className="topbar-badge">Admin</span>
          <span>·</span>
          <button className="topbar-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <ul className="sidebar-nav">
            <li className="sidebar-nav-item">
              <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
                <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
                <span>Ticket Queue</span>
              </NavLink>
            </li>
          </ul>
        </aside>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
