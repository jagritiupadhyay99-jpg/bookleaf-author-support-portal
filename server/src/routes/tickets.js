const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  createTicket,
  getMyTickets,
  getTicketById,
} = require('../controllers/ticketController');

// ── Author endpoints ──────────────────────────────────────────
// POST /api/tickets
router.post('/', authenticate, requireRole('author'), createTicket);

// GET /api/tickets/my
router.get('/my', authenticate, requireRole('author'), getMyTickets);

// GET /api/tickets/:ticketId (author or admin)
router.get('/:ticketId', authenticate, getTicketById);

module.exports = router;
