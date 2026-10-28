import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthorLayout({ children }) {
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
        <NavLink to="/dashboard" className="topbar-brand">
          <svg className="topbar-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span>BookLeaf</span>
        </NavLink>
        <span className="topbar-portal-label">Author Portal</span>
        <div className="topbar-spacer" />
        <div className="topbar-user">
          <span className="topbar-user-name">{user?.name}</span>
          <span>·</span>
          <button className="topbar-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <ul className="sidebar-nav">
            <li className="sidebar-nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="sidebar-nav-item">
              <NavLink to="/books" className={({ isActive }) => isActive ? 'active' : ''}>
                <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <span>My Books</span>
              </NavLink>
            </li>
            <li className="sidebar-nav-item">
              <NavLink to="/tickets/new" className={({ isActive }) => isActive ? 'active' : ''}>
                <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <span>New Ticket</span>
              </NavLink>
            </li>
            <li className="sidebar-nav-item">
              <NavLink to="/tickets" className={({ isActive }) => isActive ? 'active' : ''}>
                <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
                <span>My Tickets</span>
              </NavLink>
            </li>
          </ul>
        </aside>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
