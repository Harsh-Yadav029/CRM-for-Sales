const express = require('express');
const router = express.Router();
const { getActivities, getOpenClosedForRecord } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getActivities);

router.route('/related/:module/:id')
  .get(getOpenClosedForRecord);

module.exports = router;
