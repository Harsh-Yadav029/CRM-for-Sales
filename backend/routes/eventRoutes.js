const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  checkAvailability,
  getTeamCalendar
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { eventSchema } = require('../validators/eventValidator');

router.use(protect);

router.post('/availability', checkAvailability);
router.get('/team', authorize('admin', 'manager'), getTeamCalendar);

router.route('/')
  .get(getEvents)
  .post(validate(eventSchema), createEvent);

router.route('/:id')
  .get(getEventById)
  .put(validate(eventSchema), updateEvent)
  .delete(deleteEvent);

module.exports = router;
