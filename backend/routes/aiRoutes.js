const express = require('express');
const router = express.Router();
const { scoreLead, draftEmail, getNextAction, chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/score/:leadId', scoreLead);
router.post('/draft-email', draftEmail);
router.get('/next-action/:leadId', getNextAction);
router.post('/chat', chatWithAI);

module.exports = router;
