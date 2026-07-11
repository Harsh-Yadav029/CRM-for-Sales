const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
  addLeadNote,
  importLeads
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');
const { checkLeadLimit } = require('../middleware/subscriptionMiddleware');

router.use(protect);

router.post('/import', checkLeadLimit, audit('Lead'), importLeads);

router.route('/')
  .get(getLeads)
  .post(checkLeadLimit, audit('Lead'), createLead);

router.route('/:id')
  .get(getLeadById)
  .put(audit('Lead'), updateLead)
  .delete(authorize('admin'), audit('Lead'), deleteLead);

router.put('/:id/assign', authorize('admin'), audit('Lead'), assignLead);
router.put('/:id/status', audit('Lead'), updateLeadStatus);
router.post('/:id/notes', audit('Lead'), addLeadNote);

module.exports = router;
