/**
 * resetPasswords.js
 * -----------------
 * Resets all author & admin passwords to the values from .env.
 * Also re-seeds admin if missing.
 *
 * Usage:
 *   node seed/resetPasswords.js
 *
 * To target a DIFFERENT MongoDB URI (e.g. Vercel's DB), run:
 *   $env:MONGODB_URI="mongodb+srv://..."; node seed/resetPasswords.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function resetPasswords() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  console.log(`\nConnecting to: ${uri.replace(/:([^@]+)@/, ':****@')}\n`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB\n');

  const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL    || 'admin@bookleaf.demo').toLowerCase();
  const ADMIN_NAME     = process.env.ADMIN_NAME      || 'BookLeaf Admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  || 'Admin@1234';
  const DEMO_PASSWORD  = process.env.DEMO_AUTHOR_PASSWORD || 'Author@1234';

  // 1. Reset admin password
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const adminResult = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash: adminHash, role: 'admin', authorId: null } },
    { upsert: true, new: true }
  );
  console.log(`Admin  -> ${adminResult.email}  password reset to: ${ADMIN_PASSWORD}`);

  // 2. Reset all author passwords
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const authorUpdateResult = await User.updateMany(
    { role: 'author' },
    { $set: { passwordHash: demoHash } }
  );
  console.log(`Authors -> ${authorUpdateResult.modifiedCount} user(s) password reset to: ${DEMO_PASSWORD}`);

  // 3. Show all users for verification
  const users = await User.find({}).select('name email role authorId').lean();
  console.log('\nUsers in database:');
  users.forEach(u => {
    console.log(`   [${u.role.toUpperCase()}] ${u.name} -- ${u.email} ${u.authorId ? `(${u.authorId})` : ''}`);
  });

  console.log('\nPassword reset complete!\n');
  await mongoose.disconnect();
}

resetPasswords().catch(err => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
