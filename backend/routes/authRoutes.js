const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getSalespeople, googleLogin, linkedinLogin } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/linkedin-login', linkedinLogin);
router.get('/profile', protect, getUserProfile);
router.get('/salespeople', protect, authorize('admin'), getSalespeople);

module.exports = router;
