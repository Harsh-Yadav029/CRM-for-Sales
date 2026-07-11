const Quota = require('../models/Quota');

const getQuotas = async (req, res, next) => {
  try {
    const quotas = await Quota.find({ tenantId: req.tenantId }).populate('userId', 'name email');
    res.json(quotas);
  } catch (error) {
    next(error);
  }
};

const createQuota = async (req, res, next) => {
  try {
    const { userId, year, quarter, targetAmount, attainedAmount } = req.body;
    const quota = await Quota.create({
      tenantId: req.tenantId,
      userId,
      year,
      quarter,
      targetAmount,
      attainedAmount: attainedAmount || 0
    });
    res.status(201).json(quota);
  } catch (error) {
    next(error);
  }
};

const updateQuota = async (req, res, next) => {
  try {
    const quota = await Quota.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quota) {
      res.status(404);
      return next(new Error('Quota not found'));
    }
    res.json(quota);
  } catch (error) {
    next(error);
  }
};

const deleteQuota = async (req, res, next) => {
  try {
    const quota = await Quota.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!quota) {
      res.status(404);
      return next(new Error('Quota not found'));
    }
    res.json({ message: 'Quota removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotas,
  createQuota,
  updateQuota,
  deleteQuota
};
