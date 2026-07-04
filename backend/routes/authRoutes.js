const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getSalespeople } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/salespeople', protect, authorize('admin'), getSalespeople);

module.exports = router;
