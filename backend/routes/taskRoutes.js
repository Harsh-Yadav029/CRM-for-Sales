const express = require('express');
const router = express.Router();
const { getTasks, deleteTask } = require('../controllers/taskController');
const { createTask, updateTask, completeTask } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/complete')
  .post(completeTask);

module.exports = router;
