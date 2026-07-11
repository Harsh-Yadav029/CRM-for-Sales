const express = require('express');
const router = express.Router();
const { getQuotas, createQuota, updateQuota, deleteQuota } = require('../controllers/quotaController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getQuotas)
  .post(createQuota);

router.route('/:id')
  .put(updateQuota)
  .delete(deleteQuota);

module.exports = router;
