/**
 * Idempotent seed script.
 * Run: node seed/seed.js
 *
 * Creates 10 authors, 18 books, and 1 admin using .env settings.
 * Uses upsert to avoid duplicating records on re-run.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const User = require('../src/models/User');
const Book = require('../src/models/Book');

const DATA_FILE = path.join(__dirname, '../../bookleaf_sample_data.json');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(rawData);

  const DEMO_PASSWORD = process.env.DEMO_AUTHOR_PASSWORD || 'Demo@1234';
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  let authorCount = 0;
  let bookCount = 0;

  for (const authorData of data.authors) {
    // Upsert author user
    const userDoc = {
      authorId: authorData.author_id,
      name: authorData.name,
      email: authorData.email.trim().toLowerCase(),
      phone: authorData.phone || null,
      city: authorData.city || null,
      joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      passwordHash: demoHash,
      role: 'author',
    };

    const user = await User.findOneAndUpdate(
      { authorId: authorData.author_id },
      { $setOnInsert: userDoc },
      { upsert: true, new: true }
    );

    // Update passwordHash (needed if password changed)
    await User.updateOne({ authorId: authorData.author_id }, { passwordHash: demoHash });

    authorCount++;
    console.log(`  Author: ${authorData.name} (${authorData.author_id})`);

    // Upsert books
    for (const bookData of (authorData.books || [])) {
      const bookDoc = {
        bookId: bookData.book_id,
        authorId: authorData.author_id,
        title: bookData.title,
        isbn: bookData.isbn || null,
        genre: bookData.genre || null,
        publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
        status: bookData.status,
        mrp: bookData.mrp !== undefined ? bookData.mrp : null,
        authorRoyaltyPerCopy: bookData.author_royalty_per_copy !== undefined ? bookData.author_royalty_per_copy : null,
        totalCopiesSold: bookData.total_copies_sold ?? 0,
        totalRoyaltyEarned: bookData.total_royalty_earned ?? 0,
        royaltyPaid: bookData.royalty_paid ?? 0,
        royaltyPending: bookData.royalty_pending ?? 0,
        lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
        printPartner: bookData.print_partner || null,
        availableOn: bookData.available_on || [],
      };

      await Book.findOneAndUpdate(
        { bookId: bookData.book_id },
        { $set: bookDoc },
        { upsert: true, new: true }
      );

      bookCount++;
      console.log(`    Book: ${bookData.title} (${bookData.book_id})`);
    }
  }

  // Seed admin
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@bookleaf.demo').toLowerCase();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'BookLeaf Admin';
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash: adminHash, role: 'admin', authorId: null } },
    { upsert: true }
  );
  console.log(`  Admin: ${ADMIN_NAME} (${ADMIN_EMAIL})`);

  console.log(`\nSeed complete: ${authorCount} authors, ${bookCount} books seeded.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
