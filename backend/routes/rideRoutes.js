const express = require('express');
const router = express.Router();
const { estimateFare, bookRide, getRideStatus, getMyRides, updateRideStatus, sendEmergencyAlert } = require('../controllers/rideController');
const auth = require('../middleware/authMiddleware');

router.post('/estimate', auth, estimateFare);
router.post('/book', auth, bookRide);
router.get('/history/me', auth, getMyRides);
router.post('/:id/emergency-alert', auth, sendEmergencyAlert);
router.get('/:id', auth, getRideStatus);
router.patch('/:id/status', auth, updateRideStatus);

module.exports = router;
