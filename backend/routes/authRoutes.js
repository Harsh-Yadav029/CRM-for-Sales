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
  linkedinLogin 
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

// Apply rate limiting to all auth endpoints
router.use(authRateLimiter);

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/google-login', googleLogin);
router.post('/linkedin-login', linkedinLogin);

router.get('/profile', protect, getUserProfile);
// Restrict to admins and managers of the tenant
router.get('/salespeople', protect, checkRole(['admin', 'manager']), getSalespeople);

module.exports = router;
