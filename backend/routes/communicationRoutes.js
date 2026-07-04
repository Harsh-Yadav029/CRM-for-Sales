const express = require('express');
const router = express.Router();
const { sendEmail, logCall, getTwilioToken } = require('../controllers/communicationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/email', sendEmail);
router.post('/call', logCall);
router.get('/twilio-token', getTwilioToken);

module.exports = router;
