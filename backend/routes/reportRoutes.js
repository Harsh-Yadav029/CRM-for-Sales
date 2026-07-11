const express = require('express');
const router = express.Router();
const { getReportAnalytics, exportCSV, exportPDF } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');

router.use(protect);

// Cache analytics reports for 300 seconds (5 mins)
router.get('/analytics', cacheMiddleware(300), getReportAnalytics);

router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

module.exports = router;
