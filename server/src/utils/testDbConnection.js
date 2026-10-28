const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
    console.log('STATUS: CREDENTIALS_NEEDED');
    process.exit(0);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    console.log('STATUS: CONNECTED_SUCCESSFULLY host=' + conn.connection.host);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    const safeMsg = (err.message || '').replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('STATUS: CONNECTION_FAILED ' + safeMsg);
    process.exit(1);
  }
}

testConnection();
