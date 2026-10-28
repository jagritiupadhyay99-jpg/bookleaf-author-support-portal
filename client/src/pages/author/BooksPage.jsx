import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AuthorLayout from '../../layouts/AuthorLayout';
import { formatCurrency, formatNumber, formatDate, statusClass } from '../../utils/format';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyBooks()
      .then((res) => setBooks(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AuthorLayout><div className="loading-center"><div className="spinner" /></div></AuthorLayout>;
  if (error) return <AuthorLayout><div className="alert alert-error">{error}</div></AuthorLayout>;

  return (
    <AuthorLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Published Titles</h1>
          <p className="page-subtitle">{books.length} title{books.length !== 1 ? 's' : ''} registered in your BookLeaf catalog.</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      {books.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">No books found</div>
            <div className="empty-state-desc">Contact support if you believe this is an error.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {books.map((book) => (
            <BookItem key={book._id} book={book} />
          ))}
        </div>
      )}
    </AuthorLayout>
  );
}

function BookItem({ book }) {
  const isPublished = book.status === 'Published & Live';

  return (
    <div className="card">
      <div className="card-header" style={{ padding: '12px 18px', background: '#fafbfc' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--color-text-main)' }}>{book.title}</span>
          <span className="text-small text-muted" style={{ marginLeft: 8 }}>
            {book.genre || 'General'} · ID: {book.bookId}
          </span>
        </div>
        <span className={statusClass(isPublished ? 'Resolved' : 'In Progress')}>
          {book.status}
        </span>
      </div>
      <div className="card-body" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 16px', marginBottom: 14 }}>
          <MetaField label="ISBN" value={book.isbn} />
          <MetaField label="Publication Date" value={formatDate(book.publicationDate)} />
          <MetaField label="Retail MRP" value={formatCurrency(book.mrp)} />
          <MetaField label="Royalty / Copy" value={formatCurrency(book.authorRoyaltyPerCopy)} />
          <MetaField label="Print Partner" value={book.printPartner} />
          <MetaField label="Copies Sold" value={formatNumber(book.totalCopiesSold)} />
          <MetaField label="Gross Royalty" value={formatCurrency(book.totalRoyaltyEarned)} />
          <MetaField label="Royalty Paid" value={formatCurrency(book.royaltyPaid)} />
          <div>
            <div style={{ fontSize: '0.675rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
              Pending Balance
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: book.royaltyPending > 0 ? '#b45309' : 'inherit' }}>
              {formatCurrency(book.royaltyPending)}
            </div>
          </div>
        </div>

        {book.availableOn && book.availableOn.length > 0 && (
          <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="text-small text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Retail channels:</span>
              {book.availableOn.map((channel) => (
                <span key={channel} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-xs)', padding: '1px 6px', fontSize: '0.725rem', color: '#334155' }}>
                  {channel}
                </span>
              ))}
            </div>
            <Link to={`/tickets/new?bookId=${book.bookId}`} className="btn btn-secondary btn-sm">
              Submit Ticket for this Book
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.675rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
        {value || 'Not available'}
      </div>
    </div>
  );
}
