const express = require('express');
const router = express.Router();
const { generateVoiceToken, getCallRecordings } = require('../controllers/voiceController');
const { handleOutboundCall } = require('../controllers/twimlController');
const { protect } = require('../middleware/authMiddleware');

// Twilio Access Token generation endpoint requires authentication
router.post('/token', protect, generateVoiceToken);

// Audit & Playback of call recordings
router.get('/recordings', protect, getCallRecordings);

// TwiML webhook endpoint is public (validated via X-Twilio-Signature check)
router.post('/twiml', handleOutboundCall);

module.exports = router;

