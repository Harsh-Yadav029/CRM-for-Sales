const Workflow = require('../models/Workflow');

// @desc    Get all automation workflows
// @route   GET /api/workflows
// @access  Private
const getWorkflows = async (req, res, next) => {
  try {
    const rules = await Workflow.find({});
    res.json(rules);
  } catch (error) {
    next(error);
  }
};

// @desc    Define new workflow rule
// @route   POST /api/workflows
// @access  Private/Admin
const createWorkflow = async (req, res, next) => {
  const { name, triggerStage, actionType, taskTitle, emailSubject, emailBody } = req.body;

  try {
    if (!name || !triggerStage || !actionType) {
      res.status(400);
      return next(new Error('Name, trigger stage, and action type are required'));
    }

    if (actionType === 'task' && !taskTitle) {
      res.status(400);
      return next(new Error('Task title is required for task actions'));
    }

    if (actionType === 'email' && (!emailSubject || !emailBody)) {
      res.status(400);
      return next(new Error('Email subject and body are required for email actions'));
    }

    const workflow = await Workflow.create({
      name,
      triggerStage,
      actionType,
      taskTitle: taskTitle || '',
      emailSubject: emailSubject || '',
      emailBody: emailBody || ''
    });

    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workflow rule
// @route   DELETE /api/workflows/:id
// @access  Private/Admin
const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      res.status(404);
      return next(new Error('Workflow not found'));
    }

    await Workflow.deleteOne({ _id: workflow._id });
    res.json({ message: 'Workflow removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkflows,
  createWorkflow,
  deleteWorkflow
};
