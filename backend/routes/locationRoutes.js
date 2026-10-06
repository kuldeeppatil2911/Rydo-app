const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { searchLocation, reverseLocation } = require('../controllers/locationController');

router.get('/search', auth, searchLocation);
router.get('/reverse', auth, reverseLocation);

module.exports = router;
