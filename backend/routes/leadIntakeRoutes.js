const express = require('express');
const router = express.Router();
const { handleLeadIntake } = require('../controllers/leadIntakeController');
const { intakeRateLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { leadIntakeSchema } = require('../validators/leadIntakeValidator');

router.post('/lead', intakeRateLimiter, validate(leadIntakeSchema), handleLeadIntake);

module.exports = router;
