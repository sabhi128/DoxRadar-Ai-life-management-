const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
} = require('../controllers/authController');
const {
    getGoogleAuthUrl,
    googleCallback,
    disconnectGmail
} = require('../controllers/googleAuthController');
const { upgradeTest, downgradeTest } = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upgrade-test', protect, upgradeTest);
router.post('/downgrade-test', protect, downgradeTest);

// Google OAuth
router.get('/google', protect, getGoogleAuthUrl);
router.post('/google/disconnect', protect, disconnectGmail);
router.get('/google/callback', googleCallback);

module.exports = router;
