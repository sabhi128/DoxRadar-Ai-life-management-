const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
