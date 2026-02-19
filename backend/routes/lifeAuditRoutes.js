const express = require('express');
const router = express.Router();
const {
    getLifeAudits,
    createLifeAudit,
    getMonthlyReport,
} = require('../controllers/lifeAuditController');
const { protect } = require('../middleware/authMiddleware');

router.route('/report').get(protect, getMonthlyReport);
router.route('/').get(protect, getLifeAudits).post(protect, createLifeAudit);

module.exports = router;
