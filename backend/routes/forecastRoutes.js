const express = require('express');
const router = express.Router();
const { getSalesForecast } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSalesForecast);

module.exports = router;
