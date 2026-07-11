const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  updateUserStatus, 
  createInvite, 
  getInvites, 
  exportTenantData, 
  deactivateTenant 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(checkRole(['admin', 'manager']), getUsers);

router.route('/:id/status')
  .put(checkRole(['admin']), updateUserStatus);

router.route('/invites')
  .post(checkRole(['admin']), createInvite)
  .get(checkRole(['admin', 'manager']), getInvites);

router.route('/export-data')
  .get(checkRole(['admin']), exportTenantData);

router.route('/deactivate-tenant')
  .post(checkRole(['admin']), deactivateTenant);

module.exports = router;
