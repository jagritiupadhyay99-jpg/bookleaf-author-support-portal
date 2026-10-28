const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getMyBooks, getDashboard } = require('../controllers/authorController');

router.use(authenticate, requireRole('author'));

router.get('/books', getMyBooks);
router.get('/dashboard', getDashboard);

module.exports = router;
