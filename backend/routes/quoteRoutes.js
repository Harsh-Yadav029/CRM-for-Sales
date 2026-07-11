const express = require('express');
const router = express.Router();
const { getQuotes, createQuote, updateQuote, deleteQuote } = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

router.use(protect);

router.route('/')
  .get(getQuotes)
  .post(audit('Quote'), createQuote);

router.route('/:id')
  .put(audit('Quote'), updateQuote)
  .delete(audit('Quote'), deleteQuote);

module.exports = router;
