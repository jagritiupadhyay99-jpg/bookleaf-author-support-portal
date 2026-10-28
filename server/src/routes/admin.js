const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getAdminStats,
  getAdminTickets,
  getAdminTicketById,
  updateAdminTicket,
  assignToMe,
  addInternalNote,
  generateAiDraft,
  sendPublicMessage,
  reanalyzeTicket,
} = require('../controllers/ticketController');

// All admin routes require authentication and admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', getAdminStats);

// GET /api/admin/tickets
router.get('/tickets', getAdminTickets);

// GET /api/admin/tickets/:ticketId
router.get('/tickets/:ticketId', getAdminTicketById);

// PATCH /api/admin/tickets/:ticketId
router.patch('/tickets/:ticketId', updateAdminTicket);

// POST /api/admin/tickets/:ticketId/assign-to-me
router.post('/tickets/:ticketId/assign-to-me', assignToMe);

// POST /api/admin/tickets/:ticketId/notes
router.post('/tickets/:ticketId/notes', addInternalNote);

// POST /api/admin/tickets/:ticketId/ai-draft
router.post('/tickets/:ticketId/ai-draft', generateAiDraft);

// POST /api/admin/tickets/:ticketId/messages
router.post('/tickets/:ticketId/messages', sendPublicMessage);

// POST /api/admin/tickets/:ticketId/reanalyze
router.post('/tickets/:ticketId/reanalyze', reanalyzeTicket);

module.exports = router;
