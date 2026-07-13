const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const { buildLeadSharingQuery } = require('../utils/sharingRules');
const { pushEventToExternalCalendar } = require('../services/nylasCalendarSync');

// Get all events scoped by role, tenant, and optional date range
const getEvents = async (req, res, next) => {
  try {
    const baseQuery = await buildLeadSharingQuery(req);
    const query = { ...baseQuery };

    // Support ?from=&to= date range query
    if (req.query.from || req.query.to) {
      query.startTime = {};
      if (req.query.from) {
        query.startTime.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        query.startTime.$lte = new Date(req.query.to);
      }
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    const events = await Event.find(query)
      .populate('assignedTo', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// Get event by ID
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('assignedTo', 'name email')
      .populate('participants.userId', 'name email');

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// Create a new event
const createEvent = async (req, res, next) => {
  const {
    type,
    title,
    description,
    startTime,
    endTime,
    timezone,
    relatedTo,
    participants,
    location,
    conferenceLink,
    colorTag,
    recurrence,
    reminders,
    status
  } = req.body;

  try {
    // Basic date validation
    if (new Date(startTime) >= new Date(endTime)) {
      res.status(400);
      return next(new Error('Start time must be before end time'));
    }

    // Related record validation
    if (relatedTo && relatedTo.recordId) {
      let recordExists = false;
      const recId = relatedTo.recordId;

      if (relatedTo.module === 'Lead' || relatedTo.module === 'Deal') {
        const lead = await Lead.findOne({ _id: recId, tenantId: req.tenantId });
        if (lead) recordExists = true;
      } else if (relatedTo.module === 'Contact') {
        const contact = await Contact.findOne({ _id: recId, tenantId: req.tenantId });
        if (contact) recordExists = true;
      } else if (relatedTo.module === 'Account') {
        const company = await Company.findOne({ _id: recId, tenantId: req.tenantId });
        if (company) recordExists = true;
      }

      if (!recordExists) {
        res.status(400);
        return next(new Error(`Related ${relatedTo.module} record does not exist or belongs to another tenant`));
      }
    }

    const eventData = {
      tenantId: req.tenantId,
      type,
      title,
      description,
      startTime,
      endTime,
      timezone,
      relatedTo,
      assignedTo: req.body.assignedTo || req.user._id,
      participants: participants || [],
      location,
      conferenceLink,
      colorTag: colorTag || 'neutral',
      recurrence,
      reminders,
      status: status || 'scheduled'
    };

    const newEvent = new Event(eventData);
    await newEvent.save();

    // Push to Nylas external calendar
    await pushEventToExternalCalendar(newEvent);

    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};

// Update an event
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Strip tenantId to enforce isolation
    const updates = { ...req.body };
    delete updates.tenantId;

    if (updates.startTime && updates.endTime) {
      if (new Date(updates.startTime) >= new Date(updates.endTime)) {
        res.status(400);
        return next(new Error('Start time must be before end time'));
      }
    }

    // Validate relatedTo if updated
    if (updates.relatedTo && updates.relatedTo.recordId) {
      let recordExists = false;
      const recId = updates.relatedTo.recordId;

      if (updates.relatedTo.module === 'Lead' || updates.relatedTo.module === 'Deal') {
        const lead = await Lead.findOne({ _id: recId, tenantId: req.tenantId });
        if (lead) recordExists = true;
      } else if (updates.relatedTo.module === 'Contact') {
        const contact = await Contact.findOne({ _id: recId, tenantId: req.tenantId });
        if (contact) recordExists = true;
      } else if (updates.relatedTo.module === 'Account') {
        const company = await Company.findOne({ _id: recId, tenantId: req.tenantId });
        if (company) recordExists = true;
      }

      if (!recordExists) {
        res.status(400);
        return next(new Error(`Related ${updates.relatedTo.module} record does not exist or belongs to another tenant`));
      }
    }

    Object.assign(event, updates);
    await event.save();

    // Sync updates back to external calendar
    await pushEventToExternalCalendar(event);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// Delete an event
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Role-gate: rep can only delete their own; admins/managers can delete any within tenant
    if (req.user.role === 'rep' && event.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Unauthorized to delete this event'));
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Check availability (Busy blocks checking)
const checkAvailability = async (req, res, next) => {
  const { userIds, startTime, endTime } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || !startTime || !endTime) {
      res.status(400);
      return next(new Error('Please provide userIds (Array), startTime, and endTime'));
    }

    // Query active non-cancelled events for the specified users overlapping the target window
    const overlappingEvents = await Event.find({
      tenantId: req.tenantId,
      assignedTo: { $in: userIds },
      status: { $ne: 'cancelled' },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).select('assignedTo startTime endTime title');

    const busyBlocks = overlappingEvents.map(evt => ({
      userId: evt.assignedTo,
      startTime: evt.startTime,
      endTime: evt.endTime,
      title: evt.title
    }));

    res.json(busyBlocks);
  } catch (error) {
    next(error);
  }
};

// Get team calendar
const getTeamCalendar = async (req, res, next) => {
  try {
    // Reuses the manager-scope logic already in buildLeadSharingQuery
    const baseQuery = await buildLeadSharingQuery(req);
    const query = { ...baseQuery };

    // Support ?from=&to= date range query
    if (req.query.from || req.query.to) {
      query.startTime = {};
      if (req.query.from) {
        query.startTime.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        query.startTime.$lte = new Date(req.query.to);
      }
    }

    const events = await Event.find(query)
      .populate('assignedTo', 'name email')
      .populate('participants.userId', 'name email')
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
