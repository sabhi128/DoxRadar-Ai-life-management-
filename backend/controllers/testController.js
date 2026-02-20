const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Upgrade user to Pro (Test only)
// @route   POST /api/auth/upgrade-test
// @access  Private
const upgradeTest = asyncHandler(async (req, res) => {
    // Use raw SQL to bypass stale client
    await prisma.$executeRaw`UPDATE "User" SET plan = 'Pro' WHERE id = ${req.user.id}`;

    res.status(200).json({
        message: 'Successfully upgraded to Pro',
        plan: 'Pro'
    });
});

module.exports = { upgradeTest };
