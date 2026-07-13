const express = require('express');
const router = express.Router();
const { 
  sendEmail, 
  logCall, 
  sendSMS,
  getTwilioToken,
  nylasChallenge,
  nylasWebhook,
  twilioWebhook 
} = require('../controllers/communicationController');
const { protect } = require('../middleware/authMiddleware');

// Public Webhook routes (called by Nylas & Twilio servers directly, bypassing JWT checks)
router.get('/webhooks/nylas', nylasChallenge);
router.post('/webhooks/nylas', nylasWebhook);
router.post('/webhooks/twilio', twilioWebhook);

// Protected client-side routes (used by logged-in users session)
router.use(protect);

router.post('/email', sendEmail);
router.post('/call', logCall);
router.post('/sms', sendSMS);
router.get('/twilio-token', getTwilioToken);

module.exports = router;
