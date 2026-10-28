const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  // If already fully connected, reuse connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, await the existing in-flight promise
  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  const rawUri = process.env.MONGODB_URI || '';
  const uri = rawUri.trim().replace(/[\r\n\t]+/g, '');

  if (!uri) {
    const err = new Error('MONGODB_URI environment variable is missing.');
    err.status = 500;
    err.code = 'CONFIG_ERROR';
    throw err;
  }

  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    })
    .then((conn) => {
      console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      cachedPromise = null;
      console.error('[DB] Connection error:', err.message);
      throw err;
    });

  return cachedPromise;
};

module.exports = connectDB;
