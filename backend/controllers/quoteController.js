const Quote = require('../models/Quote');

const getQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({})
      .populate('companyId', 'name')
      .populate('contactId', 'firstName lastName email')
      .populate('items.productId', 'name price sku');
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

const createQuote = async (req, res, next) => {
  try {
    const { companyId, contactId, title, items, status, validUntil } = req.body;
    const quote = await Quote.create({
      companyId,
      contactId,
      title,
      items,
      status,
      validUntil
    });
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quote) {
      res.status(404);
      return next(new Error('Quote not found'));
    }
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id });
    if (!quote) {
      res.status(404);
      return next(new Error('Quote not found'));
    }
    res.json({ message: 'Quote removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotes,
  createQuote,
  updateQuote,
  deleteQuote
};
