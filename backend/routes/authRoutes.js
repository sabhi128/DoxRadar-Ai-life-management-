const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
} = require('../controllers/authController');
const { upgradeTest, downgradeTest } = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upgrade-test', protect, upgradeTest);
router.post('/downgrade-test', protect, downgradeTest);

module.exports = router;
