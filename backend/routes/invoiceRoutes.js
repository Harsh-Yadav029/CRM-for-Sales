const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(audit('Invoice'), createInvoice);

router.route('/:id')
  .put(audit('Invoice'), updateInvoice)
  .delete(audit('Invoice'), deleteInvoice);

module.exports = router;
