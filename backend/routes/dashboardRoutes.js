const express = require('express');
const router = express.Router();
const { getStats, getRevenue, getPerformance, getSources } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');

router.use(protect);

// Cache dashboard stats for 60 seconds
router.get('/stats', cacheMiddleware(60), getStats);
router.get('/revenue', cacheMiddleware(60), getRevenue);
router.get('/performance', authorize('admin'), cacheMiddleware(60), getPerformance);
router.get('/sources', cacheMiddleware(60), getSources);

module.exports = router;
