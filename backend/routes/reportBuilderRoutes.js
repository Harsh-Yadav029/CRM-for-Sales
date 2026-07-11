const express = require('express');
const router = express.Router();
const { runPivotReport } = require('../controllers/reportBuilderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/query', runPivotReport);

module.exports = router;
