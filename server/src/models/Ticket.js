const mongoose = require('mongoose');
const crypto = require('crypto');

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const SOURCES = ['ai', 'admin', 'default'];
const AI_ANALYSIS_STATUSES = ['pending', 'complete', 'unavailable', 'failed'];

const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, default: () => crypto.randomUUID() },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['author', 'admin'], required: true },
    body: { type: String, required: true },
    visibility: { type: String, enum: ['public'], default: 'public' },
  },
  { timestamps: true }
);

const internalNoteSchema = new mongoose.Schema(
  {
    noteId: { type: String, default: () => crypto.randomUUID() },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: String, default: null }, // null = General / Account Level
    subject: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, default: 'General Inquiry' },
    categorySource: { type: String, enum: SOURCES, default: 'default' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    prioritySource: { type: String, enum: SOURCES, default: 'default' },
    status: { type: String, enum: STATUSES, default: 'Open' },
    assigneeUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    aiAnalysisStatus: { type: String, enum: AI_ANALYSIS_STATUSES, default: 'pending' },
    aiDraft: { type: String, default: null },
    aiReason: { type: String, default: null },
    messages: [messageSchema],
    internalNotes: [internalNoteSchema],
    attachments: [
      {
        name: { type: String, required: true },
        size: { type: Number, default: 0 },
        type: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-generate ticket number before save
ticketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    try {
      const count = await mongoose.model('Ticket').countDocuments();
      this.ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
    } catch {
      this.ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    }
  }
  next();
});

ticketSchema.index({ authorUserId: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ assigneeUserId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
