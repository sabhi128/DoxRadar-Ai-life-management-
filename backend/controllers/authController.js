const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

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
        plan: req.user.plan || 'Free', // Defaults to 'Free' if null
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
