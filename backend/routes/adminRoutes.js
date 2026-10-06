const express = require('express');
const router = express.Router();
const { getStats, getAllBookings } = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/stats', auth, requireRole('admin'), getStats);
router.get('/bookings', auth, requireRole('admin'), getAllBookings);

module.exports = router;
