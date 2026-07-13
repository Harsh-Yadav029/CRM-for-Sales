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
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createEventSchema, updateEventSchema } = require('../validators/eventValidator');

router.use(protect);

router.route('/availability')
  .post(checkAvailability);

router.route('/team')
  .get(checkRole(['admin', 'manager']), getTeamCalendar);

router.route('/')
  .get(getEvents)
  .post(validate(createEventSchema), createEvent);

router.route('/:id')
  .get(getEventById)
  .put(validate(updateEventSchema), updateEvent)
  .delete(deleteEvent);

module.exports = router;
