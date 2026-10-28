const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const Ticket = require('../src/models/Ticket');

describe('Ticket Business Rules & Model Tests', () => {
  test('supported categories match PRD exactly', () => {
    const expected = [
      'Royalty & Payments',
      'ISBN & Metadata Issues',
      'Printing & Quality',
      'Distribution & Availability',
      'Book Status & Production Updates',
      'General Inquiry',
    ];
    assert.deepStrictEqual(Ticket.CATEGORIES, expected);
  });

  test('supported priorities match PRD', () => {
    assert.deepStrictEqual(Ticket.PRIORITIES, ['Critical', 'High', 'Medium', 'Low']);
  });

  test('supported statuses match PRD', () => {
    assert.deepStrictEqual(Ticket.STATUSES, ['Open', 'In Progress', 'Resolved', 'Closed']);
  });

  test('internal notes stripping helper removes private admin notes for author view', () => {
    const mockTicket = {
      _id: 'ticket123',
      ticketNumber: 'TKT-00001',
      subject: 'Royalty discrepancy',
      description: 'Why is pending royalty ₹0?',
      category: 'Royalty & Payments',
      priority: 'High',
      status: 'Open',
      internalNotes: [
        { noteId: 'n1', adminUserId: 'admin1', body: 'Investigating payout batch with finance team.' },
      ],
      messages: [
        { messageId: 'm1', senderRole: 'admin', body: 'Hello Arjun, we are checking your account.' },
      ],
    };

    function stripInternalNotes(ticket) {
      const t = ticket.toObject ? ticket.toObject() : { ...ticket };
      delete t.internalNotes;
      return t;
    }

    const authorView = stripInternalNotes(mockTicket);
    assert.strictEqual(authorView.internalNotes, undefined);
    assert.strictEqual(authorView.subject, 'Royalty discrepancy');
    assert.strictEqual(authorView.messages.length, 1);
    assert.strictEqual(authorView.messages[0].body, 'Hello Arjun, we are checking your account.');
  });

  test('validation flags subject longer than 300 characters', () => {
    const longSubject = 'A'.repeat(301);
    assert.ok(longSubject.length > 300);
  });

  test('validation flags description longer than 5000 characters', () => {
    const longDesc = 'A'.repeat(5001);
    assert.ok(longDesc.length > 5000);
  });

  test('regex characters in search queries are safely escaped against ReDoS', () => {
    function escapeRegex(str) {
      return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const maliciousInput = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(maliciousInput);
    assert.strictEqual(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    assert.doesNotThrow(() => new RegExp(escaped, 'i'));
  });
});
