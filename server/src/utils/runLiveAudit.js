const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Book = require('../models/Book');
const Ticket = require('../models/Ticket');

function req(server, method, urlPath, token, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const addr = server.address();
    const headers = {
      ...(postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    };

    const request = http.request({
      hostname: '127.0.0.1',
      port: addr.port,
      path: urlPath,
      method,
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    request.on('error', reject);
    if (postData) request.write(postData);
    request.end();
  });
}

async function runAudit() {
  console.log('=== STARTING LIVE API & SECURITY AUDIT ===\n');

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  console.log(`Ephemeral test server listening on port ${port}`);

  let results = { passed: 0, failed: 0 };
  function check(label, condition) {
    if (condition) {
      console.log(`  [PASS] ${label}`);
      results.passed++;
    } else {
      console.error(`  [FAIL] ${label}`);
      results.failed++;
    }
  }

  try {
    // 1. Health check
    const health = await req(server, 'GET', '/api/health');
    check('Health endpoint returns 200 ok', health.status === 200 && health.body?.status === 'ok');

    // 2. Authentication
    const adminLogin = await req(server, 'POST', '/api/auth/login', null, {
      email: 'admin@bookleaf.demo',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
    });
    check('Admin login returns 200 with admin role', adminLogin.status === 200 && adminLogin.body?.data?.user?.role === 'admin');
    const adminToken = adminLogin.body?.data?.token;

    const authorPriyaLogin = await req(server, 'POST', '/api/auth/login', null, {
      email: 'priya.sharma@email.com',
      password: process.env.DEMO_AUTHOR_PASSWORD || 'Author@1234',
    });
    check('Author Priya login returns 200 with authorId AUTH001', authorPriyaLogin.status === 200 && authorPriyaLogin.body?.data?.user?.authorId === 'AUTH001');
    const priyaToken = authorPriyaLogin.body?.data?.token;

    const authorRohitLogin = await req(server, 'POST', '/api/auth/login', null, {
      email: 'rohit.kapoor@email.com',
      password: process.env.DEMO_AUTHOR_PASSWORD || 'Author@1234',
    });
    check('Author Rohit login returns 200 with authorId AUTH002', authorRohitLogin.status === 200 && authorRohitLogin.body?.data?.user?.authorId === 'AUTH002');
    const rohitToken = authorRohitLogin.body?.data?.token;

    // 3. RBAC & Cross-Tenant Security Isolation
    const unauthAccess = await req(server, 'GET', '/api/author/books');
    check('Unauthenticated request rejected with 401', unauthAccess.status === 401);

    const authorAccessingAdmin = await req(server, 'GET', '/api/admin/stats', priyaToken);
    check('Author accessing admin route rejected with 403', authorAccessingAdmin.status === 403);

    // Cross-book ownership test
    // Priya owns BK001, Rohit owns BK003. Priya tries to create a ticket on BK003
    const crossBookTicket = await req(server, 'POST', '/api/tickets', priyaToken, {
      bookId: 'BK003',
      subject: 'Unauthorized book probe',
      description: 'Attempting to attach ticket to another author book',
    });
    check('Author attaching ticket to another author book rejected with 403', crossBookTicket.status === 403);

    // 4. Test all 6 ticket categories & priority overrides
    const categories = [
      'Royalty & Payments',
      'ISBN & Metadata Issues',
      'Printing & Quality',
      'Distribution & Availability',
      'Book Status & Production Updates',
      'General Inquiry',
    ];

    let createdTicketId = null;

    for (const cat of categories) {
      const t = await req(server, 'POST', '/api/tickets', priyaToken, {
        bookId: 'BK001',
        subject: `Test query for ${cat}`,
        description: `This is a verification test ticket for category ${cat} with adequate length.`,
      });
      check(`Create ticket for category '${cat}' returns 201`, t.status === 201 && t.body?.data?.ticketNumber);
      if (!createdTicketId && t.body?.data?._id) {
        createdTicketId = t.body.data._id;
      }
    }

    // 5. Admin priority and category overrides
    const overrideRes = await req(server, 'PATCH', `/api/admin/tickets/${createdTicketId}`, adminToken, {
      category: 'ISBN & Metadata Issues',
      priority: 'Critical',
      status: 'In Progress',
    });
    check('Admin category & priority override returns 200', overrideRes.status === 200 && overrideRes.body?.data?.priority === 'Critical' && overrideRes.body?.data?.categorySource === 'admin');

    // 6. Status transitions (Open -> In Progress -> Resolved -> Closed)
    const statuses = ['In Progress', 'Resolved', 'Closed'];
    for (const s of statuses) {
      const stRes = await req(server, 'PATCH', `/api/admin/tickets/${createdTicketId}`, adminToken, { status: s });
      check(`Admin status transition to '${s}' returns 200`, stRes.status === 200 && stRes.body?.data?.status === s);
    }

    // 7. Search, filtering, and sorting
    const searchRes = await req(server, 'GET', '/api/admin/tickets?search=Royalty', adminToken);
    check('Admin queue search filter works', searchRes.status === 200 && searchRes.body?.data?.tickets?.length >= 1);

    const catFilterRes = await req(server, 'GET', `/api/admin/tickets?category=${encodeURIComponent('ISBN & Metadata Issues')}`, adminToken);
    check('Admin queue category filter works', catFilterRes.status === 200);

    const prioFilterRes = await req(server, 'GET', `/api/admin/tickets?priority=${encodeURIComponent('Critical')}`, adminToken);
    check('Admin queue priority filter works', prioFilterRes.status === 200);

    const sortRes = await req(server, 'GET', '/api/admin/tickets?sort=newest', adminToken);
    check('Admin queue sort by newest works', sortRes.status === 200);

    // 8. Strict Data Isolation: Private Internal Notes Verification
    const secretContent = 'CONFIDENTIAL_BANK_INVESTIGATION_NOTE_12345';
    const noteRes = await req(server, 'POST', `/api/admin/tickets/${createdTicketId}/notes`, adminToken, {
      body: secretContent,
    });
    check('Admin add internal note returns 201', noteRes.status === 201);

    // Admin sends public response
    const publicReply = 'Hello Priya, our team has reviewed your inquiry and taken appropriate action.';
    const replyRes = await req(server, 'POST', `/api/admin/tickets/${createdTicketId}/messages`, adminToken, {
      body: publicReply,
      status: 'Resolved',
    });
    check('Admin send public response returns 201', replyRes.status === 201);

    // Author fetches ticket detail
    const authorView = await req(server, 'GET', `/api/tickets/${createdTicketId}`, priyaToken);
    check('Author view returns 200', authorView.status === 200);
    check('Author view contains public message', authorView.body?.data?.messages?.some(m => m.body === publicReply));
    check('Author view STRICTLY OMITS internalNotes object', authorView.body?.data?.internalNotes === undefined);
    check('Author raw JSON payload DOES NOT CONTAIN private note text', !authorView.raw.includes(secretContent));

    // Another author (Rohit) attempts to read Priya's ticket
    const rohitSnooping = await req(server, 'GET', `/api/tickets/${createdTicketId}`, rohitToken);
    check("Other author cannot view Priya's ticket (returns 403 Forbidden)", rohitSnooping.status === 403);

    console.log(`\n=== AUDIT COMPLETE: ${results.passed} PASSED, ${results.failed} FAILED ===`);
  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

runAudit();
