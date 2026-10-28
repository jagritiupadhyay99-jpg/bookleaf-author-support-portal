import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDate, formatCurrency, priorityClass, statusClass, timeAgo } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

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

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams();
  const { addToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');

  // Note
  const [noteBody, setNoteBody] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // AI draft
  const [draft, setDraft] = useState('');
  const [draftMock, setDraftMock] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Response
  const [responseBody, setResponseBody] = useState('');
  const [statusAfterSend, setStatusAfterSend] = useState('In Progress');
  const [sending, setSending] = useState(false);

  // Saving overrides
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await api.getAdminTicket(ticketId);
      setTicket(res.data.ticket);
      setBook(res.data.book);
      setCategory(res.data.ticket.category);
      setPriority(res.data.ticket.priority);
      setStatus(res.data.ticket.status);
      if (res.data.ticket.aiDraft && !draft) setDraft(res.data.ticket.aiDraft);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const saveOverride = async () => {
    setSavingOverride(true);
    try {
      await api.updateTicket(ticketId, { category, priority, status });
      addToast('Ticket classifications updated.', 'success');
      fetchTicket();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await api.assignToMe(ticketId);
      addToast('Ticket assigned to your account.', 'success');
      fetchTicket();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setAddingNote(true);
    try {
      await api.addNote(ticketId, noteBody.trim());
      setNoteBody('');
      addToast('Internal note recorded.', 'success');
      fetchTicket();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleGenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await api.generateDraft(ticketId);
      setDraft(res.data.draft);
      setDraftMock(res.data.isMock);
      setResponseBody(res.data.draft);
      addToast(res.message, 'success');
    } catch (err) {
      addToast(err.message || 'AI drafting service unavailable.', 'error');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      await api.reanalyze(ticketId);
      addToast('AI classification refreshed.', 'success');
      fetchTicket();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseBody.trim()) {
      addToast('Response content cannot be empty.', 'error');
      return;
    }
    setSending(true);
    try {
      await api.sendResponse(ticketId, responseBody.trim(), statusAfterSend);
      setResponseBody('');
      addToast('Public response dispatched to author.', 'success');
      fetchTicket();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <AdminLayout><div className="loading-center"><div className="spinner" /></div></AdminLayout>;
  if (error) return <AdminLayout><div className="alert alert-error">{error}<br/><Link to="/admin">Back to Queue</Link></div></AdminLayout>;

  const author = ticket.authorUserId;

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link to="/admin" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>← Ticket Queue</Link>
          </div>
          <h1 className="page-title">{ticket.subject}</h1>
          <div className="text-small text-muted" style={{ marginTop: 2 }}>
            Reference: {ticket.ticketNumber} · Created {formatDate(ticket.createdAt)} ({timeAgo(ticket.createdAt)})
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
          <span className={statusClass(ticket.status)}>{ticket.status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
        {/* Left Column: Author Context, Query, AI Draft, Composer, History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Context Card: Author & Book */}
          <div className="card">
            <div className="card-header" style={{ background: '#f8fafc' }}>
              <span className="card-title">Author &amp; Context Details</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="text-small text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Author Profile</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: 2 }}>{author?.name || 'Unknown Author'}</div>
                  <div className="text-small text-muted">{author?.email}</div>
                  <div className="text-small text-muted">{author?.city ? `City: ${author.city}` : ''} {author?.authorId ? `(ID: ${author.authorId})` : ''}</div>
                </div>
                <div>
                  <div className="text-small text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Attached Resource</div>
                  {book ? (
                    <div style={{ marginTop: 2 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{book.title}</div>
                      <div className="text-small text-muted">ID: {book.bookId} · {book.status}</div>
                      <div className="text-small text-muted">Sold: {book.totalCopiesSold} · Pending Royalty: {formatCurrency(book.royaltyPending)}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 2, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      General / Administrative Inquiry
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Original Author Inquiry */}
          <div className="card">
            <div className="card-header" style={{ background: '#f8fafc' }}>
              <span className="card-title">Author Inquiry Content</span>
              <span className="text-small text-muted">{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="card-body">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.875rem' }}>
                {ticket.description}
              </div>
              {ticket.attachments?.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Author Attachments ({ticket.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ticket.attachments.map((att, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          background: '#f8fafc',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{att.name}</span>
                        {att.size > 0 && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            ({(att.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Response Drafting (Human-in-the-Loop) */}
          <div className="card">
            <div className="card-header" style={{ background: '#f0f7ff', borderBottomColor: '#bae6fd' }}>
              <div>
                <span className="card-title" style={{ color: '#0369a1' }}>AI Policy Copilot</span>
                <span className="text-small text-muted" style={{ marginLeft: 8 }}>Grounds response in BookLeaf policies</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {ticket.aiAnalysisStatus === 'unavailable' && (
                  <span className="badge badge-mock">Heuristic Mode</span>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateDraft}
                  disabled={generatingDraft}
                >
                  {generatingDraft ? 'Generating Draft...' : 'Generate AI Draft'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {ticket.aiReason && (
                <div className="alert alert-info" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                  <strong>Classification Context:</strong> {ticket.aiReason}
                </div>
              )}
              {draftMock && (
                <div className="alert alert-warning" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                  <strong>Heuristic Fallback:</strong> Draft constructed using local BookLeaf policy rules (configure LLM_API_KEY for dynamic generative models).
                </div>
              )}
              {draft ? (
                <div>
                  <textarea
                    className="ai-draft-textarea"
                    rows={8}
                    readOnly
                    value={draft}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setResponseBody(draft)}
                    >
                      Copy Draft into Response Composer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-muted text-small">
                  Click "Generate AI Draft" to create a grounded response proposal based on policy and book sales metrics.
                </div>
              )}
            </div>
          </div>

          {/* Public Response Composer */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Compose Public Response</span>
              <span className="text-small text-muted">Visible to author upon dispatch</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSendResponse}>
                <div className="form-group">
                  <textarea
                    id="response-body"
                    className="form-control"
                    rows={6}
                    placeholder="Write an empathetic, specific response to the author..."
                    value={responseBody}
                    onChange={(e) => setResponseBody(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="text-small text-muted">Status transition:</span>
                    <select
                      className="form-control"
                      value={statusAfterSend}
                      onChange={(e) => setStatusAfterSend(e.target.value)}
                      style={{ width: 'auto', padding: '5px 24px 5px 8px' }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button id="send-response" type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Public Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Prior Public Correspondence */}
          {ticket.messages?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Correspondence History ({ticket.messages.length})</span>
              </div>
              <div className="card-body">
                <div className="message-timeline">
                  {ticket.messages.map((msg) => (
                    <div key={msg._id} className="message-item">
                      <div className={`message-bubble ${msg.senderRole === 'admin' ? 'message-bubble-admin' : 'message-bubble-author'}`}>
                        <div className="message-header">
                          <span className="message-sender" style={{ color: msg.senderRole === 'admin' ? 'var(--color-primary)' : 'inherit' }}>
                            {msg.senderRole === 'admin' ? 'BookLeaf Operations' : (author?.name || 'Author')}
                          </span>
                          <span className="message-time">{formatDate(msg.createdAt)}</span>
                        </div>
                        <div className="message-body">{msg.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Routing Controls, Assignment, and Private Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ticket Classification Controls */}
          <div className="card">
            <div className="card-header" style={{ background: '#f8fafc' }}>
              <span className="card-title">Routing &amp; Categorization</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  Category
                  {ticket.categorySource === 'ai' && (
                    <span className="badge badge-ai" style={{ marginLeft: 6, fontSize: '0.625rem' }}>AI Suggested</span>
                  )}
                  {ticket.categorySource === 'admin' && (
                    <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: '0.625rem' }}>Manual Override</span>
                  )}
                </label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Priority
                  {ticket.prioritySource === 'ai' && (
                    <span className="badge badge-ai" style={{ marginLeft: 6, fontSize: '0.625rem' }}>AI Suggested</span>
                  )}
                  {ticket.prioritySource === 'admin' && (
                    <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: '0.625rem' }}>Manual Override</span>
                  )}
                </label>
                <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Workflow Status</label>
                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  id="save-override"
                  className="btn btn-primary btn-sm w-full"
                  onClick={saveOverride}
                  disabled={savingOverride}
                >
                  {savingOverride ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleReanalyze}
                  title="Re-run automated classification"
                >
                  Refresh AI
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Assignment */}
          <div className="card">
            <div className="card-header" style={{ background: '#f8fafc' }}>
              <span className="card-title">Staff Assignment</span>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="text-small text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Operator</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: 2 }}>
                  {ticket.assigneeUserId?.name || 'Unassigned (General Queue)'}
                </div>
              </div>
              <button
                id="assign-to-me"
                type="button"
                className="btn btn-secondary btn-sm w-full"
                onClick={handleAssignToMe}
              >
                Assign to Me
              </button>
            </div>
          </div>

          {/* Private Internal Notes (Strictly Hidden from Authors) */}
          <div className="card">
            <div className="card-header" style={{ background: '#fffbeb', borderBottomColor: '#fef08a' }}>
              <div>
                <span className="card-title" style={{ color: '#854d0e' }}>Private Internal Notes</span>
                <div style={{ fontSize: '0.675rem', color: '#92400e', fontWeight: 500 }}>Permanently hidden from author view</div>
              </div>
            </div>
            <div className="card-body">
              {(ticket.internalNotes || []).length === 0 ? (
                <div className="text-muted text-small mb-3" style={{ fontStyle: 'italic' }}>
                  No internal investigation notes logged.
                </div>
              ) : (
                (ticket.internalNotes || []).map((note) => (
                  <div key={note._id} className="internal-note-box">
                    <div className="internal-note-meta">
                      <span className="internal-note-tag">Restricted Internal Note</span>
                      <span className="text-small text-muted" style={{ fontSize: '0.7rem' }}>{timeAgo(note.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: '0.825rem', whiteSpace: 'pre-wrap', color: '#451a03' }}>
                      {note.body}
                    </div>
                  </div>
                ))
              )}

              <form onSubmit={handleAddNote} style={{ marginTop: 12 }}>
                <div className="form-group mb-2">
                  <textarea
                    id="note-body"
                    className="form-control"
                    rows={3}
                    placeholder="Log internal note (e.g., finance batch confirmed)..."
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    style={{ minHeight: 70, fontSize: '0.825rem' }}
                  />
                </div>
                <button
                  id="add-note"
                  type="submit"
                  className="btn btn-secondary btn-sm w-full"
                  disabled={addingNote}
                >
                  {addingNote ? 'Recording...' : 'Add Internal Note'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
