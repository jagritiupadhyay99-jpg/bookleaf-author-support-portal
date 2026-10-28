import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await login(email.trim(), password);
      addToast(`Welcome back, ${loggedIn.name}.`, 'success');
      navigate(loggedIn.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 6, background: '#0f172a', color: '#38bdf8', marginBottom: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <h1 className="auth-brand-title">BookLeaf Publishing</h1>
          <p className="auth-brand-sub">Author Support &amp; Communication Portal</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              className={`form-control ${error && !email ? 'error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="author@email.com or admin@bookleaf.demo"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary w-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
            Seeded Demo Credentials
          </div>
          <table className="auth-credentials-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text-main)', width: '28%' }}>Support Admin</td>
                <td>admin@bookleaf.demo</td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>Admin@1234</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Sample Author</td>
                <td>priya.sharma@email.com</td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>Author@1234</td>
              </tr>
            </tbody>
          </table>
          <p className="text-small text-muted" style={{ fontSize: '0.725rem', marginTop: 6 }}>
            All 10 seeded authors use the same demo password.
          </p>
        </div>
      </div>
    </div>
  );
}
