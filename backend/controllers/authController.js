const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');
const supabase = require('../config/supabase');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    res.status(400).json({ message: 'Please use Supabase Auth on the client side.' });
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    res.status(400).json({ message: 'Please use Supabase Auth on the client side.' });
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }

    res.status(200).json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        plan: req.user.plan || 'Free',
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Please provide a name');
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
    });

    // Also sync with Supabase Auth metadata so it persists across sessions
    try {
        await supabase.auth.admin.updateUserById(req.user.id, {
            user_metadata: { name: name }
        });
    } catch (supabaseError) {
        console.error('Failed to sync name with Supabase Auth:', supabaseError.message);
        // We don't throw error here because the local DB is updated
    }

    res.status(200).json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan || 'Free',
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
};
