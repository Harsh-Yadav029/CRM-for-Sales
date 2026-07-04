const express = require('express');
const router = express.Router();
const { getWorkflows, createWorkflow, deleteWorkflow } = require('../controllers/workflowController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getWorkflows)
  .post(authorize('admin'), createWorkflow);

router.route('/:id')
  .delete(authorize('admin'), deleteWorkflow);

module.exports = router;
