const express = require('express');
const router = express.Router();
const { getCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

router.use(protect);

router.route('/')
  .get(getCompanies)
  .post(audit('Company'), createCompany);

router.route('/:id')
  .put(audit('Company'), updateCompany)
  .delete(audit('Company'), deleteCompany);

module.exports = router;
