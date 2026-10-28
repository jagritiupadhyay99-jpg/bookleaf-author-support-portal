import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import AuthorLayout from '../../layouts/AuthorLayout';
import { useToast } from '../../context/ToastContext';

const MAX_SUBJECT = 300;
const MAX_DESC = 5000;

export default function NewTicketPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(searchParams.get('bookId') || 'general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    api.getMyBooks().then((res) => setBooks(res.data)).catch(() => {});
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const newItems = selected.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
    }));
    setAttachments((prev) => [...prev, ...newItems].slice(0, 5));
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!subject.trim()) e.subject = 'Subject is required.';
    if (subject.trim().length > MAX_SUBJECT) e.subject = `Subject must be ${MAX_SUBJECT} characters or fewer.`;
    if (!description.trim()) e.description = 'Description is required.';
    if (description.trim().length > MAX_DESC) e.description = `Description must be ${MAX_DESC} characters or fewer.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.createTicket({
        bookId: bookId === 'general' ? null : bookId,
        subject: subject.trim(),
        description: description.trim(),
        attachments,
      });
      addToast('Ticket submitted successfully.', 'success');
      setSubmitted(res.data);
    } catch (err) {
      addToast(err.message || 'Failed to create ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthorLayout>
        <div className="card" style={{ maxWidth: 540, margin: '20px 0' }}>
          <div className="card-header" style={{ background: '#f0fdf4', borderBottomColor: '#bbf7d0' }}>
            <span className="card-title" style={{ color: '#166534' }}>Ticket Successfully Created</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>
              Your inquiry has been assigned reference <strong>{submitted.ticketNumber}</strong>. Our support team typically responds within 1 to 2 business days.
            </p>
            <p className="text-small text-muted mb-4">
              AI classification and priority routing have been initiated. You can monitor public responses on the ticket timeline without refreshing.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/tickets/${submitted._id}`} className="btn btn-primary btn-sm">View Ticket</Link>
              <Link to="/tickets" className="btn btn-secondary btn-sm">My Tickets</Link>
            </div>
          </div>
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Support Ticket</h1>
          <p className="page-subtitle">Submit a query regarding royalties, printing, ISBN, distribution, or general account issues.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <span className="card-title">Ticket Information</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="bookId">
                Related Book or Topic <span className="required">*</span>
              </label>
              <select id="bookId" className="form-control" value={bookId} onChange={(e) => setBookId(e.target.value)}>
                <option value="general">General / Account Level</option>
                {books.map((b) => (
                  <option key={b.bookId} value={b.bookId}>{b.title} ({b.bookId})</option>
                ))}
              </select>
              <div className="form-hint">Select a specific title from your catalog or choose General / Account Level for administrative queries.</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                id="subject"
                type="text"
                className={`form-control ${errors.subject ? 'error' : ''}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your query"
                maxLength={MAX_SUBJECT}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {errors.subject ? <div className="form-error">{errors.subject}</div> : <span />}
                <div className="form-hint">{subject.length} / {MAX_SUBJECT}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                className={`form-control ${errors.description ? 'error' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific details including relevant dates, copies, sales channels, or invoice numbers..."
                maxLength={MAX_DESC}
                rows={6}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {errors.description ? <div className="form-error">{errors.description}</div> : <span />}
                <div className="form-hint">{description.length} / {MAX_DESC}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="file-upload">
                Supporting Documents <span className="text-muted" style={{ fontWeight: 400 }}>(Optional)</span>
              </label>
              
              <div
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const selected = Array.from(e.dataTransfer.files);
                    const newItems = selected.map((f) => ({
                      name: f.name,
                      size: f.size,
                      type: f.type || 'application/octet-stream',
                    }));
                    setAttachments((prev) => [...prev, ...newItems].slice(0, 5));
                  }
                }}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: dragActive ? '#f0f9ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.txt,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Click to browse or drag &amp; drop files here
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Supports PDF, PNG, JPG, or DOCX (up to 10 MB each, max 5 files)
                  </span>
                </div>
              </div>

              {attachments.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {att.name}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          ({formatFileSize(att.size)})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-open" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Ready to Attach</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '2px 4px',
                            lineHeight: 1,
                            fontSize: '1rem',
                          }}
                          title="Remove attachment"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button id="submit-ticket" type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthorLayout>
  );
}
