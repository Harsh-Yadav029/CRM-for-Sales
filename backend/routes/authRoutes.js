const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgotPassword,
  resetPassword,
  getUserProfile, 
  getSalespeople, 
  googleLogin,
  refreshAccessToken,
  logoutUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { authRateLimiter } = require('../middleware/rateLimitMiddleware');
const { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} = require('../validators/authValidator');

// Apply rate limiting only to sensitive authentication endpoints
router.post('/register', authRateLimiter, validate(registerSchema), registerUser);
router.post('/login', authRateLimiter, validate(loginSchema), loginUser);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/google-login', authRateLimiter, googleLogin);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

router.get('/profile', protect, getUserProfile);
// Restrict to admins and managers of the tenant
router.get('/salespeople', protect, checkRole(['admin', 'manager']), getSalespeople);

module.exports = router;
