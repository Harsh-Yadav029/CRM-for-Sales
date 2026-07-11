const express = require('express');
const router = express.Router();
const { getAssignmentRules, createAssignmentRule, updateAssignmentRule, deleteAssignmentRule } = require('../controllers/assignmentRuleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAssignmentRules)
  .post(createAssignmentRule);

router.route('/:id')
  .put(updateAssignmentRule)
  .delete(deleteAssignmentRule);

module.exports = router;
