const express = require('express');
const router = express.Router();
const { getPendingRides, acceptRide, getAssignedRides } = require('../controllers/driverController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/pending', auth, requireRole('driver'), getPendingRides);
router.post('/accept', auth, requireRole('driver'), acceptRide);
router.get('/assigned', auth, requireRole('driver'), getAssignedRides);

module.exports = router;
