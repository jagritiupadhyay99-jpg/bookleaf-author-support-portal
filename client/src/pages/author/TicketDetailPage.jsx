import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import AuthorLayout from '../../layouts/AuthorLayout';
import { formatDate, priorityClass, statusClass, timeAgo } from '../../utils/format';

export default function AuthorTicketDetailPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const res = await api.getTicket(ticketId);
      setTicket(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    intervalRef.current = setInterval(fetchTicket, 8000);
    return () => clearInterval(intervalRef.current);
  }, [ticketId]);

  if (loading) return <AuthorLayout><div className="loading-center"><div className="spinner" /></div></AuthorLayout>;
  if (error) return <AuthorLayout><div className="alert alert-error">{error}<br/><Link to="/tickets">Back to My Tickets</Link></div></AuthorLayout>;

  return (
    <AuthorLayout>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link to="/tickets" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>← Back to Tickets</Link>
          </div>
          <h1 className="page-title">{ticket.subject}</h1>
          <div className="text-small text-muted" style={{ marginTop: 2 }}>
            Reference: {ticket.ticketNumber} · Created {formatDate(ticket.createdAt)}
            {lastUpdated && (
              <span style={{ marginLeft: 8 }}>
                <span className="live-dot" /> Live polling active
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
          <span className={statusClass(ticket.status)}>{ticket.status}</span>
        </div>
      </div>

      {/* Ticket Attributes Strip */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '12px 18px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', alignItems: 'center', fontSize: '0.825rem' }}>
            <div>
              <span className="text-muted">Category:</span> <span style={{ fontWeight: 600 }}>{ticket.category}</span>
            </div>
            {ticket.bookId && (
              <div>
                <span className="text-muted">Associated Book:</span> <span style={{ fontWeight: 600 }}>{ticket.bookId}</span>
              </div>
            )}
            <div>
              <span className="text-muted">Current Status:</span> <span style={{ fontWeight: 600 }}>{ticket.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notice if AI is processing or degraded */}
      {ticket.aiAnalysisStatus === 'pending' && (
        <div className="alert alert-info">
          Automated classification is currently evaluating this inquiry.
        </div>
      )}
      {(ticket.aiAnalysisStatus === 'unavailable' || ticket.aiAnalysisStatus === 'failed') && (
        <div className="alert alert-warning">
          Automated classification is unavailable. Your ticket has been queued for standard human operator review.
        </div>
      )}

      {/* Conversation History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Correspondence History</span>
          <span className="text-small text-muted">{(ticket.messages || []).length + 1} message{((ticket.messages || []).length + 1) !== 1 ? 's' : ''}</span>
        </div>
        <div className="card-body">
          <div className="message-timeline">
            {/* Original query from author */}
            <div className="message-item">
              <div className="message-bubble message-bubble-author">
                <div className="message-header">
                  <span className="message-sender">You (Author)</span>
                  <span className="message-time">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="message-body">
                  {ticket.description}
                  {ticket.attachments?.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                        Attached Documents ({ticket.attachments.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ticket.attachments.map((att, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              background: '#fff',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span style={{ fontWeight: 500 }}>{att.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Official responses */}
            {(ticket.messages || []).map((msg) => (
              <div key={msg._id} className="message-item">
                <div className={`message-bubble ${msg.senderRole === 'admin' ? 'message-bubble-admin' : 'message-bubble-author'}`}>
                  <div className="message-header">
                    <span className="message-sender" style={{ color: msg.senderRole === 'admin' ? 'var(--color-primary)' : 'inherit' }}>
                      {msg.senderRole === 'admin' ? 'BookLeaf Support Team' : 'You (Author)'}
                    </span>
                    <span className="message-time">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className="message-body">{msg.body}</div>
                </div>
              </div>
            ))}

            {(!ticket.messages || ticket.messages.length === 0) && (
              <div className="text-muted text-small" style={{ textAlign: 'center', padding: '24px 0', background: '#fafbfc', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                No support responses posted yet. Our operations team is reviewing your inquiry.
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthorLayout>
  );
}
