const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentActivity,
    getDashboardSummary,
    markNotificationAsRead
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/activity', protect, getRecentActivity);
router.get('/summary', protect, getDashboardSummary);
router.put('/notifications/:id/read', protect, markNotificationAsRead);

module.exports = router;
