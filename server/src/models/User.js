const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    authorId: { type: String, default: null }, // AUTH001..AUTH010; null for admin
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: null },
    city: { type: String, default: null },
    joinedDate: { type: Date, default: null },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['author', 'admin'], required: true },
  },
  { timestamps: true }
);

// Never expose hash in JSON
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
