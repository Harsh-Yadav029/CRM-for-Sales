const express = require('express');
const router = express.Router();
const {
  getCommunicationList,
  sendEmail,
  getEmails,
  sendWhatsappMessage,
  getWhatsappMessages,
  logCall,
  getCallLogs,
  scheduleMeeting,
  getMeetings,
  createNote,
  getNotes,
  getTimeline,
  createFeedback,
  getFeedback,
  getAiSummary,
  getClientTimeline
} = require('../controllers/communicationHubController');
const { protect } = require('../middleware/authMiddleware');

// Public route for client portal access
router.get('/client-portal/communication', getClientTimeline);

// Protected routes (require JWT authSession)
router.use(protect);

router.route('/communication')
  .get(getCommunicationList);

router.route('/emails')
  .post(sendEmail)
  .get(getEmails);

router.route('/whatsapp')
  .post(sendWhatsappMessage)
  .get(getWhatsappMessages);

router.route('/calls')
  .post(logCall)
  .get(getCallLogs);

router.route('/meetings')
  .post(scheduleMeeting)
  .get(getMeetings);

router.route('/notes')
  .post(createNote)
  .get(getNotes);

router.route('/timeline')
  .get(getTimeline);

router.route('/feedback')
  .post(createFeedback)
  .get(getFeedback);

router.route('/ai-summary')
  .get(getAiSummary);

module.exports = router;
