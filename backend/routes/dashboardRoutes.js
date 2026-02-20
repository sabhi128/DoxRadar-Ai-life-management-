const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentActivity,
    getDashboardSummary
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/activity', protect, getRecentActivity);
router.get('/summary', protect, getDashboardSummary);

module.exports = router;
