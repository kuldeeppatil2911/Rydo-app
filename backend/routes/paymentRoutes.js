const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createPayment, createCheckoutSession, getPayment } = require('../controllers/paymentController');

router.post('/', auth, createPayment);
router.post('/checkout', auth, createCheckoutSession);
router.get('/:bookingId', auth, getPayment);

module.exports = router;