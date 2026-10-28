import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AuthorLayout from '../../layouts/AuthorLayout';
import { formatCurrency, formatNumber, formatDate, statusClass } from '../../utils/format';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AuthorLayout><div className="loading-center"><div className="spinner" /></div></AuthorLayout>;
  if (error) return <AuthorLayout><div className="alert alert-error">{error}</div></AuthorLayout>;

  const { summary, books } = data;

  return (
    <AuthorLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Author Dashboard</h1>
          <p className="page-subtitle">Publishing catalog, sales performance, and royalty settlement summary.</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      {/* Financial & Catalog Performance Ribbon */}
      <div className="financial-strip">
        <div className="financial-item">
          <div className="kpi-label">Catalog</div>
          <div className="kpi-value tabular-num">{summary.totalBooks} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>books</span></div>
          <div className="kpi-sub">{summary.publishedBooks} published & live</div>
        </div>
        <div className="financial-item">
          <div className="kpi-label">Lifetime Volume</div>
          <div className="kpi-value tabular-num">{formatNumber(summary.totalCopiesSold)}</div>
          <div className="kpi-sub">Total copies sold across channels</div>
        </div>
        <div className="financial-item">
          <div className="kpi-label">Gross Royalty Earned</div>
          <div className="kpi-value tabular-num">{formatCurrency(summary.totalRoyaltyEarned)}</div>
          <div className="kpi-sub">80% author share of net profit</div>
        </div>
        <div className="financial-item">
          <div className="kpi-label">Royalty Paid</div>
          <div className="kpi-value tabular-num">{formatCurrency(summary.royaltyPaid)}</div>
          <div className="kpi-sub">Disbursed via direct transfer</div>
        </div>
        <div className="financial-item financial-item-highlight">
          <div className="kpi-label" style={{ color: '#92400e' }}>Pending Settlement</div>
          <div className="kpi-value tabular-num" style={{ color: '#b45309' }}>{formatCurrency(summary.royaltyPending)}</div>
          <div className="kpi-sub" style={{ color: '#92400e' }}>Paid within 45 days of quarter end</div>
        </div>
      </div>

      {/* Published Titles Overview */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Book Catalog</span>
          <Link to="/books" className="btn btn-ghost btn-sm">View details & distribution →</Link>
        </div>
        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No books listed</div>
            <div className="empty-state-desc">Published titles associated with your author ID will appear here.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title & Genre</th>
                  <th>Status</th>
                  <th>Copies Sold</th>
                  <th>Gross Royalty</th>
                  <th>Paid</th>
                  <th>Pending Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{book.title}</div>
                      <div className="text-small text-muted">{book.genre || 'General'} · ID: {book.bookId}</div>
                    </td>
                    <td>
                      <span className={statusClass(book.status === 'Published & Live' ? 'Resolved' : 'In Progress')}>
                        {book.status}
                      </span>
                    </td>
                    <td className="tabular-num">{formatNumber(book.totalCopiesSold)}</td>
                    <td className="tabular-num">{formatCurrency(book.totalRoyaltyEarned)}</td>
                    <td className="tabular-num text-muted">{formatCurrency(book.royaltyPaid)}</td>
                    <td className="tabular-num" style={{ fontWeight: book.royaltyPending > 0 ? 600 : 400, color: book.royaltyPending > 0 ? '#b45309' : 'inherit' }}>
                      {formatCurrency(book.royaltyPending)}
                    </td>
                    <td>
                      <Link to={`/tickets/new?bookId=${book.bookId}`} className="btn btn-secondary btn-sm">
                        Support Query
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthorLayout>
  );
}
