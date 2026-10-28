import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AuthorLayout from '../../layouts/AuthorLayout';
import { formatDate, priorityClass, statusClass, timeAgo } from '../../utils/format';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchTickets = async () => {
    try {
      const res = await api.getMyTickets();
      setTickets(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    intervalRef.current = setInterval(fetchTickets, 8000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (loading) return <AuthorLayout><div className="loading-center"><div className="spinner" /></div></AuthorLayout>;
  if (error) return <AuthorLayout><div className="alert alert-error">{error}</div></AuthorLayout>;

  return (
    <AuthorLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">
            {tickets.length} inquiry thread{tickets.length !== 1 ? 's' : ''} on record.
            {lastUpdated && (
              <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.75rem' }}>
                <span className="live-dot" /> Live polling active (updated {timeAgo(lastUpdated)})
              </span>
            )}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      {tickets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">No support tickets found</div>
            <div className="empty-state-desc">You do not have any open or resolved tickets at this time.</div>
            <div style={{ marginTop: 14 }}>
              <Link to="/tickets/new" className="btn btn-primary btn-sm">Create Support Ticket</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Responses</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="text-small text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {ticket.ticketNumber}
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket._id}`} className="table-link" style={{ fontWeight: 600 }}>
                        {ticket.subject}
                      </Link>
                      {ticket.bookId && (
                        <div className="text-small text-muted" style={{ fontSize: '0.75rem' }}>
                          Book: {ticket.bookId}
                        </div>
                      )}
                    </td>
                    <td className="text-small">{ticket.category}</td>
                    <td><span className={priorityClass(ticket.priority)}>{ticket.priority}</span></td>
                    <td><span className={statusClass(ticket.status)}>{ticket.status}</span></td>
                    <td className="text-small text-muted">{formatDate(ticket.createdAt)}</td>
                    <td className="text-small tabular-num">{ticket.messages?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AuthorLayout>
  );
}
