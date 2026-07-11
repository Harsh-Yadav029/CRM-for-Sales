const express = require('express');
const router = express.Router();
const { getBlueprints, createBlueprint, updateBlueprint, deleteBlueprint } = require('../controllers/blueprintController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(getBlueprints)
  // Only admins can configureguided process guidelines (blueprints)
  .post(checkRole(['admin']), createBlueprint);

router.route('/:id')
  .put(checkRole(['admin']), updateBlueprint)
  .delete(checkRole(['admin']), deleteBlueprint);

module.exports = router;
