const Book = require('../models/Book');

// GET /api/author/books
const getMyBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ authorId: req.user.authorId }).sort({ createdAt: 1 });
    res.json({ data: books });
  } catch (err) {
    next(err);
  }
};

// GET /api/author/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const books = await Book.find({ authorId: req.user.authorId });

    const totalBooks = books.length;
    const publishedBooks = books.filter((b) => b.status === 'Published & Live').length;
    const totalCopiesSold = books.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0);
    const totalRoyaltyEarned = books.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0);
    const royaltyPaid = books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0);
    const royaltyPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);

    res.json({
      data: {
        summary: { totalBooks, publishedBooks, totalCopiesSold, totalRoyaltyEarned, royaltyPaid, royaltyPending },
        books,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyBooks, getDashboard };
