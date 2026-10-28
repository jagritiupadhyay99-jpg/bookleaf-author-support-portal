const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const User = require('../models/User');
const { analyzeTicket } = require('../services/aiService');

const CATEGORIES = Ticket.CATEGORIES;
const PRIORITIES = Ticket.PRIORITIES;
const STATUSES = Ticket.STATUSES;

// Helper: strip internal notes from ticket for author-facing responses
function stripInternalNotes(ticket) {
  const t = ticket.toObject ? ticket.toObject() : { ...ticket };
  delete t.internalNotes;
  return t;
}

// Helper: escape regex special characters to prevent ReDoS / regex syntax errors
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/tickets — create ticket (author)
const createTicket = async (req, res, next) => {
  try {
    const { bookId, subject, description, attachments } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Subject is required.' } });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Description is required.' } });
    }
    if (subject.trim().length > 300) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Subject must be 300 characters or fewer.' } });
    }
    if (description.trim().length > 5000) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Description must be 5000 characters or fewer.' } });
    }

    let bookContext = null;

    // Validate book ownership if bookId provided
    if (bookId && bookId !== 'general') {
      const book = await Book.findOne({ bookId });
      if (!book) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Book not found.' } });
      }
      if (book.authorId !== req.user.authorId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot attach a ticket to this book.' } });
      }
      bookContext = book;
    }

    // Save ticket immediately — do NOT wait for AI
    const ticket = new Ticket({
      authorUserId: req.user._id,
      bookId: bookId && bookId !== 'general' ? bookId : null,
      subject: subject.trim(),
      description: description.trim(),
      attachments: Array.isArray(attachments) ? attachments.slice(0, 10).map((a) => ({
        name: String(a.name || 'document').slice(0, 255),
        size: Number(a.size) || 0,
        type: String(a.type || '').slice(0, 100),
      })) : [],
      aiAnalysisStatus: 'pending',
    });
    await ticket.save();

    // Attempt AI classification asynchronously (fire and forget)
    setImmediate(async () => {
      try {
        const result = await analyzeTicket({
          subject: ticket.subject,
          description: ticket.description,
          bookContext: bookContext ? { title: bookContext.title, status: bookContext.status } : null,
        });

        if (result) {
          ticket.category = result.category;
          ticket.priority = result.priority;
          ticket.categorySource = result.isMock ? 'default' : 'ai';
          ticket.prioritySource = result.isMock ? 'default' : 'ai';
          ticket.aiReason = result.reason;
          ticket.aiAnalysisStatus = result.isMock ? 'unavailable' : 'complete';
        } else {
          ticket.aiAnalysisStatus = 'failed';
        }
        await ticket.save();
      } catch (err) {
        console.error('[Ticket AI] Classification error:', err.message);
        try {
          ticket.aiAnalysisStatus = 'failed';
          await ticket.save();
        } catch (_) {}
      }
    });

    const safeTicket = stripInternalNotes(ticket);
    res.status(201).json({
      data: safeTicket,
      message: 'Ticket created. AI classification is in progress.',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/my — author's own tickets (no internal notes)
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ authorUserId: req.user._id })
      .select('-internalNotes')
      .sort({ createdAt: -1 })
      .populate('assigneeUserId', 'name email');

    res.json({ data: tickets });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:ticketId — author or admin
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('authorUserId', 'name email authorId')
      .populate('assigneeUserId', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    if (req.user.role === 'author') {
      if (!ticket.authorUserId._id.equals(req.user._id)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
      return res.json({ data: stripInternalNotes(ticket) });
    }

    // Admin gets full ticket including internal notes
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/tickets — filtered ticket queue
const getAdminTickets = async (req, res, next) => {
  try {
    const { status, category, priority, from, to, search, sort, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        if (typeof to === 'string' && to.length === 10) {
          toDate.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = toDate;
      }
    }
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.$or = [
        { subject: { $regex: sanitized, $options: 'i' } },
        { ticketNumber: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // Build sort
    // Priority order: Critical (1) > High (2) > Medium (3) > Low (4)
    // Status order: Open (1) > In Progress (2) > Resolved (3) > Closed (4)
    let sortObj = {};
    if (sort === 'priority_oldest' || sort === 'urgent_oldest') {
      sortObj = { priorityWeight: 1, createdAt: 1 };
    } else if (sort === 'newest') {
      sortObj = { createdAt: -1 };
    } else {
      // Default: unresolved first, most urgent, then oldest
      sortObj = { statusWeight: 1, priorityWeight: 1, createdAt: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .select('-internalNotes')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('authorUserId', 'name email authorId')
        .populate('assigneeUserId', 'name email'),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      data: { tickets, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/tickets/:ticketId — full detail including internal notes
const getAdminTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('authorUserId', 'name email authorId city joinedDate phone')
      .populate('assigneeUserId', 'name email')
      .populate('internalNotes.adminUserId', 'name email')
      .populate('messages.senderUserId', 'name role');

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    let book = null;
    if (ticket.bookId) {
      book = await Book.findOne({ bookId: ticket.bookId });
    }

    res.json({ data: { ticket, book } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/tickets/:ticketId — update status, category, priority, assignee
const updateAdminTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    const { status, category, priority, assigneeUserId } = req.body;

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid status: ${status}` } });
      }
      ticket.status = status;
    }

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid category: ${category}` } });
      }
      ticket.category = category;
      ticket.categorySource = 'admin';
    }

    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid priority: ${priority}` } });
      }
      ticket.priority = priority;
      ticket.prioritySource = 'admin';
    }

    if (assigneeUserId !== undefined) {
      ticket.assigneeUserId = assigneeUserId || null;
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    res.json({ data: ticket, message: 'Ticket updated.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tickets/:ticketId/assign-to-me
const assignToMe = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.ticketId,
      { assigneeUserId: req.user._id, lastActivityAt: new Date() },
      { new: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }
    res.json({ data: ticket, message: 'Ticket assigned to you.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tickets/:ticketId/notes — add internal note
const addInternalNote = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Note body is required.' } });
    }

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    ticket.internalNotes.push({ adminUserId: req.user._id, body: body.trim() });
    ticket.lastActivityAt = new Date();
    await ticket.save();

    res.status(201).json({ data: ticket.internalNotes.at(-1), message: 'Note added.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tickets/:ticketId/ai-draft — generate AI draft
const generateAiDraft = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('authorUserId', 'name');

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    let book = null;
    if (ticket.bookId) {
      book = await Book.findOne({ bookId: ticket.bookId });
    }

    const { generateResponseDraft, isMockMode } = require('../services/aiService');
    const result = await generateResponseDraft({
      ticket: { subject: ticket.subject, description: ticket.description, category: ticket.category, priority: ticket.priority },
      bookContext: book ? { title: book.title, status: book.status, mrp: book.mrp, totalCopiesSold: book.totalCopiesSold } : null,
      authorName: ticket.authorUserId?.name,
    });

    if (!result) {
      return res.status(503).json({ error: { code: 'AI_UNAVAILABLE', message: 'AI draft generation failed. Please write a manual response.' } });
    }

    // Persist draft in ticket for convenience
    ticket.aiDraft = result.draft;
    await ticket.save();

    res.json({
      data: { draft: result.draft, isMock: result.isMock },
      message: result.isMock ? 'Mock draft generated (no LLM key configured).' : 'AI draft generated. Please review before sending.',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tickets/:ticketId/messages — send public response
const sendPublicMessage = async (req, res, next) => {
  try {
    const { body, statusAfterSend } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Response body is required.' } });
    }

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    ticket.messages.push({
      senderUserId: req.user._id,
      senderRole: 'admin',
      body: body.trim(),
      visibility: 'public',
    });

    if (statusAfterSend && STATUSES.includes(statusAfterSend)) {
      ticket.status = statusAfterSend;
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    res.status(201).json({ data: ticket.messages.at(-1), message: 'Response sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tickets/:ticketId/reanalyze — re-run AI classification
const reanalyzeTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    }

    let book = null;
    if (ticket.bookId) {
      book = await Book.findOne({ bookId: ticket.bookId });
    }

    const result = await analyzeTicket({
      subject: ticket.subject,
      description: ticket.description,
      bookContext: book ? { title: book.title, status: book.status } : null,
    });

    if (!result) {
      ticket.aiAnalysisStatus = 'failed';
      await ticket.save();
      return res.status(503).json({ error: { code: 'AI_UNAVAILABLE', message: 'AI re-analysis failed.' } });
    }

    ticket.category = result.category;
    ticket.priority = result.priority;
    ticket.categorySource = result.isMock ? 'default' : 'ai';
    ticket.prioritySource = result.isMock ? 'default' : 'ai';
    ticket.aiReason = result.reason;
    ticket.aiAnalysisStatus = result.isMock ? 'unavailable' : 'complete';
    await ticket.save();

    res.json({ data: { category: ticket.category, priority: ticket.priority, reason: ticket.aiReason, isMock: result.isMock }, message: 'Re-analysis complete.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats — dashboard stats
const getAdminStats = async (req, res, next) => {
  try {
    const [open, criticalHigh, unassigned, resolved] = await Promise.all([
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ priority: { $in: ['Critical', 'High'] }, status: { $nin: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({ assigneeUserId: null, status: { $nin: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({ status: 'Resolved' }),
    ]);
    res.json({ data: { open, criticalHigh, unassigned, resolved } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  getAdminTickets,
  getAdminTicketById,
  updateAdminTicket,
  assignToMe,
  addInternalNote,
  generateAiDraft,
  sendPublicMessage,
  reanalyzeTicket,
  getAdminStats,
};
