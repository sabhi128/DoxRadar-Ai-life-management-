const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentActivity,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/activity', protect, getRecentActivity);

module.exports = router;
