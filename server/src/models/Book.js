const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true, unique: true }, // BK001–BK018
    authorId: { type: String, required: true }, // References User.authorId
    title: { type: String, required: true },
    isbn: { type: String, default: null },
    genre: { type: String, default: null },
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

bookSchema.index({ authorId: 1 });

module.exports = mongoose.model('Book', bookSchema);
