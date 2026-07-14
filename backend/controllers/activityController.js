const Task = require('../models/Task');
const Event = require('../models/Event');
const User = require('../models/User');
const { buildLeadSharingQuery } = require('../utils/sharingRules');

// Reusable function to compute auto-close status for events
const computeEventStatus = (event) => {
  const now = new Date();
  const eventObj = event.toObject ? event.toObject() : event;
  if (eventObj.status === 'scheduled' && new Date(eventObj.endTime) < now) {
    eventObj.status = 'completed';
  }
  return eventObj;
};

// Reusable helper to validate relatedTo record exists in the tenant context
const validateRelatedTo = async (relatedTo) => {
  if (!relatedTo || !relatedTo.module || !relatedTo.recordId) {
    return true; // No relation specified is valid
  }
  let model;
  if (relatedTo.module === 'Lead' || relatedTo.module === 'Deal') {
    model = require('../models/Lead');
  } else if (relatedTo.module === 'Contact') {
    model = require('../models/Contact');
  } else if (relatedTo.module === 'Account') {
    model = require('../models/Company');
  }

  if (model) {
    const record = await model.findOne({ _id: relatedTo.recordId });
    return !!record;
  }
  return false;
};

// @desc    Get all activities (Tasks + Events) grouped, filtered, and tenant/ownership scoped
// @route   GET /api/activities
const getActivities = async (req, res, next) => {
  try {
    const baseQuery = await buildLeadSharingQuery(req);
    const type = req.query.type || 'all'; // task | meeting | call | all
    const filter = req.query.filter || 'all'; // today | week | overdue | all

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const endOfNext7Days = new Date();
    endOfNext7Days.setDate(endOfNext7Days.getDate() + 7);
    endOfNext7Days.setHours(23, 59, 59, 999);

    let taskQuery = { ...baseQuery };
    let eventQuery = { ...baseQuery };

    // Apply relatedTo filter if specified
    if (req.query.relatedTo) {
      const parts = req.query.relatedTo.split(':');
      if (parts.length === 2) {
        taskQuery['relatedTo.module'] = parts[0];
        taskQuery['relatedTo.recordId'] = parts[1];
        eventQuery['relatedTo.module'] = parts[0];
        eventQuery['relatedTo.recordId'] = parts[1];
      }
    }

    // Apply date/status filter
    if (filter === 'today') {
      taskQuery.dueDate = { $gte: startOfToday, $lte: endOfToday };
      eventQuery.startTime = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === 'week') {
      taskQuery.dueDate = { $gte: startOfToday, $lte: endOfNext7Days };
      eventQuery.startTime = { $gte: startOfToday, $lte: endOfNext7Days };
    } else if (filter === 'overdue') {
      taskQuery.dueDate = { $lt: startOfToday };
      taskQuery.status = 'open';
      
      // Events that ended in past and are still scheduled
      eventQuery.endTime = { $lt: new Date() };
      eventQuery.status = 'scheduled';
    }

    let tasks = [];
    let events = [];

    // Query Tasks
    if (type === 'task' || type === 'all') {
      tasks = await Task.find(taskQuery)
        .populate('assignedTo', 'name email')
        .populate('relatedTo.recordId')
        .sort({ dueDate: 1 });
    }

    // Query Events (Meetings / Calls)
    if (type === 'meeting' || type === 'call' || type === 'all') {
      if (type !== 'all') {
        eventQuery.type = type;
      } else {
        eventQuery.type = { $in: ['meeting', 'call'] };
      }
      events = await Event.find(eventQuery)
        .populate('assignedTo', 'name email')
        .populate('relatedTo.recordId')
        .sort({ startTime: 1 });
    }

    // Process tasks: ensure consistent structure and map completed virtual
    const taskList = tasks.map(t => {
      const obj = t.toObject ? t.toObject() : t;
      obj.activityType = 'task';
      obj.date = obj.dueDate;
      return obj;
    });

    // Process events: compute auto-close on read and ensure consistent structure
    const eventList = events.map(e => {
      const obj = computeEventStatus(e);
      obj.activityType = obj.type; // 'meeting' or 'call'
      obj.date = obj.startTime;
      return obj;
    });

    // Merge and sort by date ascending
    let merged = [...taskList, ...eventList];
    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(merged);
  } catch (error) {
    next(error);
  }
};

// @desc    Get open and closed activities for a specific record
// @route   GET /api/activities/related/:module/:id
const getOpenClosedForRecord = async (req, res, next) => {
  const { module: moduleName, id: recordId } = req.params;

  try {
    const baseQuery = await buildLeadSharingQuery(req);
    
    const taskQuery = {
      ...baseQuery,
      'relatedTo.module': moduleName,
      'relatedTo.recordId': recordId
    };

    const eventQuery = {
      ...baseQuery,
      'relatedTo.module': moduleName,
      'relatedTo.recordId': recordId,
      type: { $in: ['meeting', 'call'] }
    };

    const [tasks, events] = await Promise.all([
      Task.find(taskQuery).populate('assignedTo', 'name email'),
      Event.find(eventQuery).populate('assignedTo', 'name email')
    ]);

    const now = new Date();

    const openActivities = [];
    const closedActivities = [];

    // Process Tasks
    tasks.forEach(t => {
      const obj = t.toObject ? t.toObject() : t;
      obj.activityType = 'task';
      obj.date = obj.dueDate;

      if (obj.status === 'open') {
        openActivities.push(obj);
      } else {
        closedActivities.push(obj);
      }
    });

    // Process Events
    events.forEach(e => {
      const obj = computeEventStatus(e);
      obj.activityType = obj.type;
      obj.date = obj.startTime;

      if (obj.status === 'scheduled' && new Date(obj.endTime) >= now) {
        openActivities.push(obj);
      } else {
        closedActivities.push(obj);
      }
    });

    // Sort by date: open ascending (soonest first), closed descending (most recent first)
    openActivities.sort((a, b) => new Date(a.date) - new Date(b.date));
    closedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      open: openActivities,
      closed: closedActivities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  const { title, description, dueDate, priority, relatedTo, assignedTo, recurrence, reminders } = req.body;

  try {
    if (!title || !dueDate) {
      res.status(400);
      return next(new Error('Title and dueDate are required'));
    }

    // Verify relatedTo record is valid
    const isValidRelation = await validateRelatedTo(relatedTo);
    if (!isValidRelation) {
      res.status(400);
      return next(new Error(`Related ${relatedTo.module} record not found`));
    }

    const finalAssignedTo = assignedTo || req.user._id;

    // Verify assignee belongs to the system
    const userExists = await User.findOne({ _id: finalAssignedTo });
    if (!userExists) {
      res.status(400);
      return next(new Error('Assigned user not found'));
    }

    const task = await Task.create({
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      relatedTo,
      assignedTo: finalAssignedTo,
      recurrence: recurrence || { frequency: 'none' },
      reminders: reminders || [],
      status: 'open'
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');
    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id });
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Ownership check for non-admin
    if (req.user.role === 'sales' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to update this task'));
    }

    const { title, description, dueDate, priority, relatedTo, assignedTo, recurrence, reminders, status, completed } = req.body;

    if (relatedTo) {
      const isValidRelation = await validateRelatedTo(relatedTo);
      if (!isValidRelation) {
        res.status(400);
        return next(new Error(`Related ${relatedTo.module} record not found`));
      }
      task.relatedTo = relatedTo;
    }

    if (assignedTo) {
      const userExists = await User.findOne({ _id: assignedTo });
      if (!userExists) {
        res.status(400);
        return next(new Error('Assigned user not found'));
      }
      task.assignedTo = assignedTo;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (priority !== undefined) task.priority = priority;
    if (recurrence !== undefined) task.recurrence = recurrence;
    if (reminders !== undefined) task.reminders = reminders;
    
    if (status !== undefined) {
      task.status = status;
      task.completed = status === 'completed';
    } else if (completed !== undefined) {
      task.completed = completed;
      task.status = completed ? 'completed' : 'open';
    }

    await task.save();
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');
    res.json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Task
// @route   POST /api/tasks/:id/complete
const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id });
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    if (req.user.role === 'sales' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to update this task'));
    }

    task.status = 'completed';
    task.completed = true;
    await task.save();

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Create Event (Meeting/Call)
// @route   POST /api/events
const createEvent = async (req, res, next) => {
  const { type, title, description, startTime, endTime, timezone, relatedTo, assignedTo, participants, location, conferenceLink, colorTag, recurrence, reminders, status } = req.body;

  try {
    if (!type || !['meeting', 'call'].includes(type)) {
      res.status(400);
      return next(new Error('Event type must be either meeting or call'));
    }
    if (!title || !startTime || !endTime) {
      res.status(400);
      return next(new Error('Title, startTime, and endTime are required'));
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      res.status(400);
      return next(new Error('startTime must be before endTime'));
    }

    const isValidRelation = await validateRelatedTo(relatedTo);
    if (!isValidRelation) {
      res.status(400);
      return next(new Error(`Related ${relatedTo.module} record not found`));
    }

    const finalAssignedTo = assignedTo || req.user._id;
    const userExists = await User.findOne({ _id: finalAssignedTo });
    if (!userExists) {
      res.status(400);
      return next(new Error('Assigned user not found'));
    }

    const event = await Event.create({
      type,
      title,
      description: description || '',
      startTime: start,
      endTime: end,
      timezone: timezone || 'UTC',
      relatedTo,
      assignedTo: finalAssignedTo,
      participants: participants || [],
      location: location || '',
      conferenceLink: conferenceLink || '',
      colorTag: colorTag || 'neutral',
      recurrence: recurrence || { frequency: 'none' },
      reminders: reminders || [],
      status: status || 'scheduled'
    });

    const populatedEvent = await Event.findById(event._id).populate('assignedTo', 'name email');
    res.status(201).json(populatedEvent);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Event
// @route   PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id });
    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    if (req.user.role === 'sales' && event.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to update this event'));
    }

    const updates = { ...req.body };

    if (updates.relatedTo) {
      const isValidRelation = await validateRelatedTo(updates.relatedTo);
      if (!isValidRelation) {
        res.status(400);
        return next(new Error(`Related ${updates.relatedTo.module} record not found`));
      }
    }

    if (updates.assignedTo) {
      const userExists = await User.findOne({ _id: updates.assignedTo });
      if (!userExists) {
        res.status(400);
        return next(new Error('Assigned user not found'));
      }
    }

    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    if (updates.startTime || updates.endTime) {
      const finalStart = updates.startTime || event.startTime;
      const finalEnd = updates.endTime || event.endTime;
      if (finalStart >= finalEnd) {
        res.status(400);
        return next(new Error('startTime must be before endTime'));
      }
    }

    Object.assign(event, updates);
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate('assignedTo', 'name email');
    res.json(populatedEvent);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Event
// @route   POST /api/events/:id/cancel
const cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id });
    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    if (req.user.role === 'sales' && event.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Access denied to cancel this event'));
    }

    event.status = 'cancelled';
    await event.save();

    res.json(event);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getOpenClosedForRecord,
  createTask,
  updateTask,
  completeTask,
  createEvent,
  updateEvent,
  cancelEvent
};
