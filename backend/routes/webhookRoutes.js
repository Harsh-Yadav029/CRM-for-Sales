const express = require('express');
const router = express.Router();
const { handleCallStatus, handleCallRecording } = require('../controllers/callWebhookController');

// Twilio call-status and recording callback webhooks (validated via X-Twilio-Signature check)
router.post('/twilio/call-status', handleCallStatus);
router.post('/twilio/recording', handleCallRecording);

module.exports = router;
