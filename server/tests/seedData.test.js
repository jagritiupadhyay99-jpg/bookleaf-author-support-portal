const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Seed Data Integrity Tests', () => {
  const dataPath = path.join(__dirname, '../../bookleaf_sample_data.json');
  assert.ok(fs.existsSync(dataPath), 'bookleaf_sample_data.json should exist');

  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);

  test('dataset contains exactly 10 authors', () => {
    assert.strictEqual(Array.isArray(data.authors), true);
    assert.strictEqual(data.authors.length, 10);
  });

  test('dataset contains exactly 18 books across all authors', () => {
    let totalBooks = 0;
    for (const author of data.authors) {
      if (Array.isArray(author.books)) {
        totalBooks += author.books.length;
      }
    }
    assert.strictEqual(totalBooks, 18);
  });

  test('all author IDs and emails are unique and formatted', () => {
    const authorIds = new Set();
    const emails = new Set();

    for (const author of data.authors) {
      assert.ok(author.author_id, 'Author must have author_id');
      assert.ok(!authorIds.has(author.author_id), `Duplicate author_id: ${author.author_id}`);
      authorIds.add(author.author_id);

      assert.ok(author.email, 'Author must have email');
      const normalizedEmail = author.email.trim().toLowerCase();
      assert.ok(!emails.has(normalizedEmail), `Duplicate email: ${normalizedEmail}`);
      emails.add(normalizedEmail);
    }
  });

  test('all book IDs are unique and book objects have required structure', () => {
    const bookIds = new Set();

    for (const author of data.authors) {
      for (const book of author.books || []) {
        assert.ok(book.book_id, 'Book must have book_id');
        assert.ok(!bookIds.has(book.book_id), `Duplicate book_id: ${book.book_id}`);
        bookIds.add(book.book_id);

        assert.ok(book.title, 'Book must have a title');
        assert.ok(book.status, 'Book must have a status');
      }
    }
  });

  test('null values in books are handled safely (e.g. publication_date, isbn)', () => {
    let foundNullPubDate = false;
    for (const author of data.authors) {
      for (const book of author.books || []) {
        if (book.publication_date === null) {
          foundNullPubDate = true;
        }
      }
    }
    assert.strictEqual(foundNullPubDate, true, 'Dataset has in-production books with null publication dates');
  });
});
