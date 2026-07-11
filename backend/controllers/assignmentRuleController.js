const AssignmentRule = require('../models/AssignmentRule');

const getAssignmentRules = async (req, res, next) => {
  try {
    const rules = await AssignmentRule.find({ tenantId: req.tenantId }).populate('assignees', 'name email');
    res.json(rules);
  } catch (error) {
    next(error);
  }
};

const createAssignmentRule = async (req, res, next) => {
  try {
    const { name, criteria, assignees, isActive, priority } = req.body;
    const rule = await AssignmentRule.create({
      tenantId: req.tenantId,
      name,
      criteria,
      assignees,
      isActive,
      priority
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
};

const updateAssignmentRule = async (req, res, next) => {
  try {
    const rule = await AssignmentRule.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!rule) {
      res.status(404);
      return next(new Error('Assignment rule not found'));
    }
    res.json(rule);
  } catch (error) {
    next(error);
  }
};

const deleteAssignmentRule = async (req, res, next) => {
  try {
    const rule = await AssignmentRule.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!rule) {
      res.status(404);
      return next(new Error('Assignment rule not found'));
    }
    res.json({ message: 'Assignment rule removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignmentRules,
  createAssignmentRule,
  updateAssignmentRule,
  deleteAssignmentRule
};
