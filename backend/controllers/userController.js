const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
    let preferences = await prisma.userPreference.findUnique({
        where: { userId: req.user.id }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
        preferences = await prisma.userPreference.create({
            data: {
                userId: req.user.id,
                emailNotifications: true,
                aiDocumentAnalysis: true,
                highCostThreshold: 50.0,
                theme: 'light'
            }
        });
    }

    res.status(200).json(preferences);
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
    const { emailNotifications, aiDocumentAnalysis, highCostThreshold, theme } = req.body;

    const preferences = await prisma.userPreference.upsert({
        where: { userId: req.user.id },
        update: {
            emailNotifications,
            aiDocumentAnalysis,
            highCostThreshold: highCostThreshold ? parseFloat(highCostThreshold) : undefined,
            theme
        },
        create: {
            userId: req.user.id,
            emailNotifications: emailNotifications ?? true,
            aiDocumentAnalysis: aiDocumentAnalysis ?? true,
            highCostThreshold: highCostThreshold ? parseFloat(highCostThreshold) : 50.0,
            theme: theme || 'light'
        }
    });

    res.status(200).json(preferences);
});

module.exports = {
    getPreferences,
    updatePreferences
};
