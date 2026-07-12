const express = require('express');
const router = express.Router();
const { getApiKeys, createApiKey, revokeApiKey } = require('../controllers/apiKeyController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(checkRole(['admin']));

router.route('/')
  .get(getApiKeys)
  .post(createApiKey);

router.route('/:id')
  .delete(revokeApiKey);

module.exports = router;
