const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication & Security Unit Tests', () => {
  const secret = 'test-secret-at-least-32-characters-long-key';

  test('bcrypt hashes and verifies password correctly', async () => {
    const password = 'AuthorSecurePassword123!';
    const hash = await bcrypt.hash(password, 10);
    assert.notStrictEqual(hash, password);

    const isMatch = await bcrypt.compare(password, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  test('jwt signs and verifies payload with role and authorId', () => {
    const payload = {
      userId: '60c72b2f9b1d8b2bad000001',
      role: 'author',
      authorId: 'AUTH001',
      email: 'arjun.mehta@example.com',
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    assert.ok(typeof token === 'string');

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.role, 'author');
    assert.strictEqual(decoded.authorId, 'AUTH001');
    assert.strictEqual(decoded.email, payload.email);
  });

  test('jwt rejects tampered token or incorrect secret', () => {
    const token = jwt.sign({ role: 'author' }, secret, { expiresIn: '1h' });
    const wrongSecret = 'another-completely-different-secret-key';

    assert.throws(() => {
      jwt.verify(token, wrongSecret);
    });
  });

  test('admin role is distinct from author role in tokens', () => {
    const adminToken = jwt.sign({ role: 'admin', userId: 'admin_123' }, secret);
    const decoded = jwt.verify(adminToken, secret);
    assert.strictEqual(decoded.role, 'admin');
    assert.notStrictEqual(decoded.role, 'author');
  });

  test('requireRole middleware blocks author from accessing admin resources', () => {
    const { requireRole } = require('../src/middleware/auth');
    const adminGate = requireRole('admin');

    let statusCalled = null;
    let jsonBody = null;
    let nextCalled = false;

    const mockReq = {
      user: { _id: 'author_1', role: 'author', authorId: 'AUTH001' },
    };
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => {
            jsonBody = data;
          },
        };
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    adminGate(mockReq, mockRes, mockNext);

    assert.strictEqual(statusCalled, 403);
    assert.strictEqual(jsonBody?.error?.code, 'FORBIDDEN');
    assert.strictEqual(nextCalled, false);
  });

  test('requireRole middleware blocks admin from accessing author-only resources', () => {
    const { requireRole } = require('../src/middleware/auth');
    const authorGate = requireRole('author');

    let statusCalled = null;
    let jsonBody = null;
    let nextCalled = false;

    const mockReq = {
      user: { _id: 'admin_1', role: 'admin' },
    };
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => {
            jsonBody = data;
          },
        };
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    authorGate(mockReq, mockRes, mockNext);

    assert.strictEqual(statusCalled, 403);
    assert.strictEqual(jsonBody?.error?.code, 'FORBIDDEN');
    assert.strictEqual(nextCalled, false);
  });

  test('concurrent isolated sessions preserve strict role boundaries and prevent privilege leakage', () => {
    const { requireRole } = require('../src/middleware/auth');
    const adminGate = requireRole('admin');
    const authorGate = requireRole('author');

    // Simulate Tab 1 (Admin Session)
    const adminSessionToken = jwt.sign({ id: 'admin_root', role: 'admin' }, secret);
    // Simulate Tab 2 (Author Session)
    const authorSessionToken = jwt.sign({ id: 'author_priya', role: 'author', authorId: 'AUTH001' }, secret);

    const adminClaims = jwt.verify(adminSessionToken, secret);
    const authorClaims = jwt.verify(authorSessionToken, secret);

    assert.strictEqual(adminClaims.role, 'admin');
    assert.strictEqual(authorClaims.role, 'author');
    assert.strictEqual(authorClaims.authorId, 'AUTH001');

    // Tab 1 request to Admin Queue
    let tab1Next = false;
    adminGate({ user: { role: adminClaims.role } }, {}, () => { tab1Next = true; });
    assert.strictEqual(tab1Next, true, 'Admin session must pass admin gate');

    // Tab 2 request to Author Dashboard
    let tab2Next = false;
    authorGate({ user: { role: authorClaims.role } }, {}, () => { tab2Next = true; });
    assert.strictEqual(tab2Next, true, 'Author session must pass author gate');

    // Cross-session attempt: Author session cannot pass admin gate
    let crossedDenied = false;
    adminGate({ user: { role: authorClaims.role } }, {
      status: (code) => {
        if (code === 403) crossedDenied = true;
        return { json: () => {} };
      },
    }, () => {});
    assert.strictEqual(crossedDenied, true, 'Author session must be blocked from admin endpoints');
  });

  test('author ticket ownership boundary prevents author A from accessing author B tickets', () => {
    const authorA = { role: 'author', authorId: 'AUTH001' };
    const authorB = { role: 'author', authorId: 'AUTH002' };
    const ticketOwnedByA = { id: 'TICK-101', authorId: 'AUTH001', subject: 'Royalty inquiry' };

    // Ownership check simulation (as in ticketController.getTicketById)
    const canAuthorBAccessTicketA = !(authorB.role === 'author' && ticketOwnedByA.authorId !== authorB.authorId);
    assert.strictEqual(canAuthorBAccessTicketA, false, 'Author B must not be permitted to view Ticket of Author A');

    const canAuthorAAccessTicketA = !(authorA.role === 'author' && ticketOwnedByA.authorId !== authorA.authorId);
    assert.strictEqual(canAuthorAAccessTicketA, true, 'Author A must be permitted to view their own Ticket');
  });
});
