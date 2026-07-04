const Task = require('../models/Task');
const Lead = require('../models/Lead');
const User = require('../models/User');

const getTasks = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'sales') {
      query.assignedTo = req.user._id;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.leadId) {
      query.leadId = req.query.leadId;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'name company status')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  const { title, dueDate, assignedTo, leadId } = req.body;

  try {
    if (!title || !dueDate) {
      res.status(400);
      return next(new Error('Please fill in title and dueDate'));
    }

    let finalAssignedTo = req.user._id;
    if (req.user.role === 'admin' && assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        res.status(400);
        return next(new Error('Assigned user not found'));
      }
      finalAssignedTo = assignedTo;
    }

    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        res.status(400);
        return next(new Error('Linked lead not found'));
      }
    }

    const task = await Task.create({
      title,
      dueDate,
      assignedTo: finalAssignedTo,
      leadId: leadId || null
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'name company status');

    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    if (req.user.role === 'sales' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to update this task'));
    }

    const fieldsToUpdate = ['title', 'dueDate', 'completed'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    if (req.user.role === 'admin' && req.body.assignedTo !== undefined) {
      task.assignedTo = req.body.assignedTo;
    }

    if (req.body.leadId !== undefined) {
      task.leadId = req.body.leadId || null;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'name company status');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    if (req.user.role === 'sales' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to delete this task'));
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
