const asyncHandler = require('express-async-handler');
const LifeAudit = require('../models/LifeAudit');

// @desc    Get life audits
// @route   GET /api/life-audit
// @access  Private
const getLifeAudits = asyncHandler(async (req, res) => {
    // Return the most recent audit first
    const audits = await LifeAudit.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(audits);
});

// @desc    Create new life audit
// @route   POST /api/life-audit
// @access  Private
const createLifeAudit = asyncHandler(async (req, res) => {
    const { scores, notes } = req.body;

    if (!scores) {
        res.status(400);
        throw new Error('Please add scores');
    }

    const audit = await LifeAudit.create({
        user: req.user.id,
        scores,
        notes,
    });

    res.status(201).json(audit);
});

module.exports = {
    getLifeAudits,
    createLifeAudit,
};
