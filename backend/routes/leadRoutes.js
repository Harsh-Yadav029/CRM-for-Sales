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

router.use(protect);

router.post('/import', importLeads);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(authorize('admin'), deleteLead);

router.put('/:id/assign', authorize('admin'), assignLead);
router.put('/:id/status', updateLeadStatus);
router.post('/:id/notes', addLeadNote);

module.exports = router;
