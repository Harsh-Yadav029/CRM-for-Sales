const Invoice = require('../models/Invoice');

const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ tenantId: req.tenantId })
      .populate('companyId', 'name')
      .populate('quoteId', 'title total')
      .populate('items.productId', 'name price sku');
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { companyId, quoteId, invoiceNumber, items, status, dueDate } = req.body;
    const invoice = await Invoice.create({
      tenantId: req.tenantId,
      companyId,
      quoteId,
      invoiceNumber,
      items,
      status,
      dueDate
    });
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      res.status(404);
      return next(new Error('Invoice not found'));
    }
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!invoice) {
      res.status(404);
      return next(new Error('Invoice not found'));
    }
    res.json({ message: 'Invoice removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
