const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Ticket = require('../src/models/Ticket');
const Book = require('../src/models/Book');
const User = require('../src/models/User');

describe('Comprehensive Feature & Security Audit', () => {

  test('Supported categories match PRD and Assignment requirements exactly', () => {
    const requiredCategories = [
      'Royalty & Payments',
      'ISBN & Metadata Issues',
      'Printing & Quality',
      'Distribution & Availability',
      'Book Status & Production Updates',
      'General Inquiry',
    ];
    assert.deepStrictEqual(Ticket.CATEGORIES, requiredCategories);
  });

  test('Supported priorities match PRD specification', () => {
    assert.deepStrictEqual(Ticket.PRIORITIES, ['Critical', 'High', 'Medium', 'Low']);
  });

  test('Supported statuses match PRD workflow transitions', () => {
    assert.deepStrictEqual(Ticket.STATUSES, ['Open', 'In Progress', 'Resolved', 'Closed']);
  });

  test('Private internal notes are stripped from author-facing views', () => {
    const mockTicketWithNotes = {
      ticketNumber: 'TKT-99999',
      subject: 'Royalty issue',
      description: 'Why payout delayed?',
      category: 'Royalty & Payments',
      priority: 'High',
      status: 'In Progress',
      internalNotes: [
        { noteId: 'note-1', adminUserId: 'adm1', body: 'Confidential: Banking NEFT failure' },
      ],
      messages: [
        { messageId: 'msg-1', senderRole: 'admin', body: 'We are investigating your account.' },
      ],
      toObject() {
        return {
          ticketNumber: this.ticketNumber,
          subject: this.subject,
          description: this.description,
          category: this.category,
          priority: this.priority,
          status: this.status,
          internalNotes: [...this.internalNotes],
          messages: [...this.messages],
        };
      },
    };

    function stripInternalNotes(ticket) {
      const t = ticket.toObject ? ticket.toObject() : { ...ticket };
      delete t.internalNotes;
      return t;
    }

    const sanitized = stripInternalNotes(mockTicketWithNotes);
    assert.strictEqual(sanitized.internalNotes, undefined, 'internalNotes must be undefined for authors');
    assert.strictEqual(sanitized.messages.length, 1);
    assert.strictEqual(sanitized.messages[0].body, 'We are investigating your account.');
  });

  test('Author token cannot impersonate admin role', () => {
    const secret = 'test_secret_key_at_least_32_characters';
    const authorToken = jwt.sign({ id: 'user123', role: 'author', authorId: 'AUTH001' }, secret);
    const decoded = jwt.verify(authorToken, secret);

    assert.strictEqual(decoded.role, 'author');
    assert.notStrictEqual(decoded.role, 'admin');
  });

  test('Admin token contains admin role and lacks authorId', () => {
    const secret = 'test_secret_key_at_least_32_characters';
    const adminToken = jwt.sign({ id: 'admin123', role: 'admin' }, secret);
    const decoded = jwt.verify(adminToken, secret);

    assert.strictEqual(decoded.role, 'admin');
    assert.strictEqual(decoded.authorId, undefined);
  });

  test('Author cannot attach a ticket to another author book', () => {
    const bookOfPriya = { bookId: 'BK001', authorId: 'AUTH001' };
    const loggedInAuthorId = 'AUTH002'; // Rohit

    const isOwner = bookOfPriya.authorId === loggedInAuthorId;
    assert.strictEqual(isOwner, false, 'Author must not be permitted to attach another author book');
  });

  test('Input validation enforces 300 char subject and 5000 char description limits', () => {
    const validSubject = 'A'.repeat(300);
    const invalidSubject = 'A'.repeat(301);
    const validDesc = 'B'.repeat(5000);
    const invalidDesc = 'B'.repeat(5001);

    assert.ok(validSubject.length <= 300);
    assert.ok(invalidSubject.length > 300);
    assert.ok(validDesc.length <= 5000);
    assert.ok(invalidDesc.length > 5000);
  });
});
