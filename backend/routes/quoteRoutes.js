const express = require('express');
const router = express.Router();
const { getQuotes, createQuote, updateQuote, deleteQuote } = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getQuotes)
  .post(createQuote);

router.route('/:id')
  .put(updateQuote)
  .delete(deleteQuote);

module.exports = router;
