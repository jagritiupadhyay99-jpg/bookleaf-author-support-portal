import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDate, priorityClass, statusClass, timeAgo } from '../../utils/format';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function AdminQueuePage() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '', sort: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTickets({ ...filters, page, limit: 20 }),
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data.tickets);
      setTotal(ticketsRes.data.total);
      setPages(ticketsRes.data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', priority: '', search: '', sort: '' });
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Operations Queue</h1>
          <p className="page-subtitle">Central triage for author support inquiries, AI priority assessments, and ticket routing.</p>
        </div>
      </div>

      {/* Compact Operational KPI Ribbon */}
      {stats && (
        <div className="kpi-ribbon">
          <div className="kpi-ribbon-item">
            <div className="kpi-label">Active Open</div>
            <div className="kpi-value tabular-num" style={{ color: 'var(--color-status-open-text)' }}>{stats.open}</div>
            <div className="kpi-sub">Awaiting first response</div>
          </div>
          <div className="kpi-ribbon-item">
            <div className="kpi-label">Critical / High</div>
            <div className="kpi-value tabular-num" style={{ color: 'var(--color-critical-text)' }}>{stats.criticalHigh}</div>
            <div className="kpi-sub">Priority SLA attention</div>
          </div>
          <div className="kpi-ribbon-item">
            <div className="kpi-label">Unassigned</div>
            <div className="kpi-value tabular-num" style={{ color: 'var(--color-high-text)' }}>{stats.unassigned}</div>
            <div className="kpi-sub">Pending staff owner</div>
          </div>
          <div className="kpi-ribbon-item">
            <div className="kpi-label">Resolved</div>
            <div className="kpi-value tabular-num" style={{ color: 'var(--color-low-text)' }}>{stats.resolved}</div>
            <div className="kpi-sub">Closed resolution cycle</div>
          </div>
        </div>
      )}

      {/* Unified Filter Toolbar */}
      <div className="toolbar">
        <input
          className="form-control"
          placeholder="Search subject, ticket #, or author name..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          style={{ flex: '1 1 220px', minWidth: 200 }}
        />
        <select
          className="form-control"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          style={{ flex: '0 1 140px' }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          style={{ flex: '0 1 170px' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          style={{ flex: '0 1 130px' }}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          style={{ flex: '0 1 140px' }}
        >
          <option value="">Default order</option>
          <option value="newest">Newest first</option>
          <option value="priority_oldest">Priority + Age</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
          Reset
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">No tickets match the current view</div>
            <div className="empty-state-desc">Try resetting your filters or search keywords.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Author &amp; Context</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="text-small text-muted" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {ticket.ticketNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {ticket.authorUserId?.name || 'Unknown Author'}
                        </div>
                        <div className="text-small text-muted" style={{ fontSize: '0.725rem' }}>
                          {ticket.bookId ? `Book: ${ticket.bookId}` : 'General Inquiry'}
                        </div>
                      </td>
                      <td>
                        <Link to={`/admin/tickets/${ticket._id}`} className="table-link" style={{ fontWeight: 500 }}>
                          {ticket.subject}
                        </Link>
                      </td>
                      <td>
                        <span className="text-small">{ticket.category}</span>
                        {ticket.categorySource === 'ai' && (
                          <span className="badge badge-ai" style={{ marginLeft: 4, fontSize: '0.625rem' }}>AI</span>
                        )}
                        {ticket.categorySource === 'admin' && (
                          <span className="badge badge-admin" style={{ marginLeft: 4, fontSize: '0.625rem' }}>Manual</span>
                        )}
                      </td>
                      <td>
                        <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
                        {ticket.prioritySource === 'ai' && (
                          <span className="badge badge-ai" style={{ marginLeft: 4, fontSize: '0.625rem' }}>AI</span>
                        )}
                      </td>
                      <td>
                        <span className={statusClass(ticket.status)}>{ticket.status}</span>
                      </td>
                      <td className="text-small">
                        {ticket.assigneeUserId?.name ? (
                          <span style={{ fontWeight: 500 }}>{ticket.assigneeUserId.name}</span>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td className="text-small text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {timeAgo(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="page-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
