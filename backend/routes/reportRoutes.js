const express = require('express');
const router = express.Router();
const { getReportAnalytics } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/analytics', getReportAnalytics);

module.exports = router;
