const express = require('express');
const router = express.Router();
const { getStats, getRevenue, getPerformance, getSources } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/performance', authorize('admin'), getPerformance);
router.get('/sources', getSources);

module.exports = router;
