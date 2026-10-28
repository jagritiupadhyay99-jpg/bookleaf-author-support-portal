const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`BookLeaf API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`LLM mode: ${process.env.LLM_PROVIDER || 'mock'} ${process.env.LLM_API_KEY ? '(key configured)' : '(no key — mock mode)'}`);
  });
}

module.exports = app;
