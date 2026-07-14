const Event = require('../models/Event');
const { buildLeadSharingQuery } = require('../utils/sharingRules');
const { pushEventToExternalCalendar } = require('../services/nylasCalendarSync');

// @desc    Get all calendar events inside optional date range matching tenant/role scoping
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    // buildLeadSharingQuery returns filters on { tenantId, assignedTo }
    const query = await buildLeadSharingQuery(req);

    if (req.query.from && req.query.to) {
      query.startTime = { $gte: new Date(req.query.from) };
      query.endTime = { $lte: new Date(req.query.to) };
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    const events = await Event.find(query)
      .populate('assignedTo', 'name email')
      .sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id })
      .populate('assignedTo', 'name email');

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event (validates start/end and optional relatedTo target record)
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res, next) => {
  const {
    type,
    title,
    description,
    startTime,
    endTime,
    timezone,
    relatedTo,
    assignedTo,
    participants,
    location,
    conferenceLink,
    colorTag,
    recurrence,
    reminders,
    status
  } = req.body;

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400);
      return next(new Error('startTime must be before endTime'));
    }

    if (relatedTo && relatedTo.module && relatedTo.recordId) {
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
        if (!record) {
          res.status(400);
          return next(new Error(`Related ${relatedTo.module} record not found`));
        }
      }
    }

    // Fallback: If no assignedTo target is selected, assign to self
    const finalAssignedTo = assignedTo || req.user._id;

    const event = await Event.create({
      type,
      title,
      description,
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

    // Invoke external Nylas sync background task
    try {
      await pushEventToExternalCalendar(event);
    } catch (syncErr) {
      console.error('Nylas external calendar push error (ignored for lifecycle):', syncErr);
    }

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  const updates = { ...req.body };

  try {
    const event = await Event.findOne({ _id: req.params.id });

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Role gate check: Only assignee or admin/manager privilege can alter event
    const isOwner = event.assignedTo.toString() === req.user._id.toString();
    const isPrivileged = ['admin', 'manager'].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      res.status(403);
      return next(new Error('Access denied: Unauthorized operation'));
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

    // Re-push to external Nylas calendar
    try {
      await pushEventToExternalCalendar(event);
    } catch (syncErr) {
      console.error('Nylas external calendar update error (ignored for lifecycle):', syncErr);
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id });

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Role-gated to admin/manager for events they don't assign to themselves; assignees can always delete their own
    const isOwner = event.assignedTo.toString() === req.user._id.toString();
    const isPrivileged = ['admin', 'manager'].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      res.status(403);
      return next(new Error('Access denied: Unauthorized operation'));
    }

    await Event.deleteOne({ _id: req.params.id });

    res.json({ message: 'Event successfully removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Check free/busy availability of team members
// @route   POST /api/events/availability
// @access  Private
const checkAvailability = async (req, res, next) => {
  const { userIds, startTime, endTime } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || !startTime || !endTime) {
      res.status(400);
      return next(new Error('Please provide userIds (Array), startTime, and endTime'));
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const overlapEvents = await Event.find({
      assignedTo: { $in: userIds },
      status: { $ne: 'cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).select('assignedTo startTime endTime title');

    res.json(overlapEvents);
  } catch (error) {
    next(error);
  }
};

// @desc    Get team calendar view for managers/admins only
// @route   GET /api/events/team
// @access  Private (Admin / Manager only)
const getTeamCalendar = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Access denied: privileged route'));
    }

    const query = await buildLeadSharingQuery(req);

    if (req.query.from && req.query.to) {
      query.startTime = { $gte: new Date(req.query.from) };
      query.endTime = { $lte: new Date(req.query.to) };
    }

    const events = await Event.find(query)
      .populate('assignedTo', 'name email')
      .sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  checkAvailability,
  getTeamCalendar
};
