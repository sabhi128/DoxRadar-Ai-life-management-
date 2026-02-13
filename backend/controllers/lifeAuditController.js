const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get life audits
// @route   GET /api/life-audit
// @access  Private
const getLifeAudits = asyncHandler(async (req, res) => {
    // Return the most recent audit first
    const audits = await prisma.lifeAudit.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
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

    const audit = await prisma.lifeAudit.create({
        data: {
            userId: req.user.id,
            ratings: scores,
            notes,
        },
    });

    res.status(201).json(audit);
});

module.exports = {
    getLifeAudits,
    createLifeAudit,
};
