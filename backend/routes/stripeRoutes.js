const express = require('express');
const router = express.Router();
const { createCheckoutSession, createPortalSession } = require('../controllers/stripeController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

router.post('/create-checkout-session', protect, checkRole(['admin']), createCheckoutSession);
router.post('/create-portal-session', protect, checkRole(['admin']), createPortalSession);

module.exports = router;
