const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' } });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    }

    const token = signToken(user);
    res.json({
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authorId: user.authorId,
          city: user.city,
        },
      },
      message: 'Login successful.',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = (_req, res) => {
  res.json({ data: null, message: 'Logged out.' });
};

// GET /api/auth/me
const me = (req, res) => {
  const { _id, name, email, role, authorId, city, joinedDate } = req.user;
  res.json({
    data: { id: _id, name, email, role, authorId, city, joinedDate },
  });
};

module.exports = { login, logout, me };
