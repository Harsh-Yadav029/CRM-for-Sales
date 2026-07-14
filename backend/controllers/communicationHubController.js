const Project = require('../models/Project');
const Communication = require('../models/Communication');
const Email = require('../models/Email');
const WhatsappMessage = require('../models/WhatsappMessage');
const CallLog = require('../models/CallLog');
const Meeting = require('../models/Meeting');
const Note = require('../models/Note');
const ActivityTimeline = require('../models/ActivityTimeline');
const Feedback = require('../models/Feedback');
const AISummary = require('../models/AISummary');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Lead = require('../models/Lead');
const { emitUserEvent } = require('../utils/socket');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const logTimeline = async ({ clientType, clientId, projectId, userId, activityType, description }) => {
  try {
    return await ActivityTimeline.create({
      clientType,
      clientId,
      projectId,
      userId,
      activityType,
      description
    });
  } catch (err) {
    console.error('Failed to log ActivityTimeline:', err.message);
  }
};

const updateAISummaryStats = async (clientId, clientType, updates) => {
  try {
    let summary = await AISummary.findOne({ clientId, clientType });
    if (!summary) {
      summary = new AISummary({ clientId, clientType });
    }
    Object.assign(summary, updates);
    await summary.save();
  } catch (err) {
    console.error('Failed to update AISummary:', err.message);
  }
};

const triggerAutomatedTask = async ({ title, description, assignedTo, clientType, clientId }) => {
  try {
    const task = await Task.create({
      title,
      description,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      priority: 'medium',
      assignedTo,
      relatedTo: {
        module: clientType === 'Lead' ? 'Lead' : 'Contact',
        recordId: clientId
      }
    });

    // Notify user
    const notif = await Notification.create({
      userId: assignedTo,
      title: 'Automated Task Created',
      message: `Follow-up task: "${title}" created automatically.`,
      link: `/tasks`
    });
    emitUserEvent(assignedTo.toString(), 'notification_received', notif);

    // Append task reference to the timeline
    await ActivityTimeline.create({
      clientType,
      clientId,
      userId: assignedTo,
      activityType: 'Task Created',
      description: `Automated follow-up task created: ${title}`,
      relatedTasks: [task._id]
    });

    return task;
  } catch (err) {
    console.error('Failed to triggerAutomatedTask:', err.message);
  }
};

const dispatchNotificationsToAdmins = async (title, message, link) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });
    await Promise.all(
      users.map(async (u) => {
        const notif = await Notification.create({
          userId: u._id,
          title,
          message,
          link
        });
        emitUserEvent(u._id.toString(), 'notification_received', notif);
      })
    );
  } catch (err) {
    console.error('Notification dispatch failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get base communications
// @route   GET /api/communication
// @access  Private
const getCommunicationList = async (req, res, next) => {
  try {
    const { clientId, clientType, projectId } = req.query;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
      if (clientType) filter.clientType = clientType;
    }
    if (projectId) filter.projectId = projectId;

    const list = await Communication.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });

    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Send / Log email
// @route   POST /api/emails
// @access  Private
const sendEmail = async (req, res, next) => {
  const { subject, body, receiver, clientType, clientId, projectId, attachments } = req.body;

  try {
    const emailRecord = await Email.create({
      subject,
      body,
      attachments: attachments || [],
      sender: req.user.email,
      receiver,
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Create Index Communication
    const comm = await Communication.create({
      clientType: emailRecord.clientType,
      clientId: emailRecord.clientId,
      projectId: emailRecord.projectId,
      userId: req.user._id,
      type: 'email',
      refId: emailRecord._id,
      summary: subject
    });

    // Write to Activity Timeline
    await logTimeline({
      clientType: emailRecord.clientType,
      clientId: emailRecord.clientId,
      projectId: emailRecord.projectId,
      userId: req.user._id,
      activityType: 'Email Sent',
      description: `Outbound email dispatched to ${receiver}: "${subject}"`
    });

    // Update AI Summary
    await updateAISummaryStats(emailRecord.clientId, emailRecord.clientType, {
      meetingSummary: `Last outbound email sent: "${subject}"`
    });

    res.status(201).json(emailRecord);
  } catch (err) {
    next(err);
  }
};

// @desc    Get emails list
// @route   GET /api/emails
// @access  Private
const getEmails = async (req, res, next) => {
  try {
    const list = await Email.find({ userId: req.user._id }).sort({ sentTime: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Send / Log WhatsApp
// @route   POST /api/whatsapp
// @access  Private
const sendWhatsappMessage = async (req, res, next) => {
  const { message, receiver, clientType, clientId, projectId } = req.body;

  try {
    const wa = await WhatsappMessage.create({
      message,
      sender: req.user.phone || 'Company',
      receiver,
      status: 'sent',
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Log Index Communication
    await Communication.create({
      clientType: wa.clientType,
      clientId: wa.clientId,
      projectId: wa.projectId,
      userId: req.user._id,
      type: 'whatsapp',
      refId: wa._id,
      summary: message.substring(0, 60)
    });

    // Write to Timeline
    await logTimeline({
      clientType: wa.clientType,
      clientId: wa.clientId,
      projectId: wa.projectId,
      userId: req.user._id,
      activityType: 'WhatsApp Sent',
      description: `WhatsApp message to ${receiver}: "${message}"`
    });

    // Update AI Summary
    await updateAISummaryStats(wa.clientId, wa.clientType, {
      nextAction: 'Await WhatsApp response'
    });

    res.status(201).json(wa);
  } catch (err) {
    next(err);
  }
};

// @desc    Get WhatsApp messages
// @route   GET /api/whatsapp
// @access  Private
const getWhatsappMessages = async (req, res, next) => {
  try {
    const list = await WhatsappMessage.find({ userId: req.user._id }).sort({ time: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Log Call log
// @route   POST /api/calls
// @access  Private
const logCall = async (req, res, next) => {
  const { duration, notes, status, clientType, clientId, projectId } = req.body;

  try {
    const call = await CallLog.create({
      duration: duration || 0,
      executiveName: req.user.name,
      notes: notes || '',
      status: status || 'completed',
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Log Index Communication
    await Communication.create({
      clientType: call.clientType,
      clientId: call.clientId,
      projectId: call.projectId,
      userId: req.user._id,
      type: 'call',
      refId: call._id,
      summary: notes || 'Call logged'
    });

    // Write to Timeline
    await logTimeline({
      clientType: call.clientType,
      clientId: call.clientId,
      projectId: call.projectId,
      userId: req.user._id,
      activityType: 'Call Completed',
      description: `Outbound call logs - duration: ${duration}s, status: ${status}. Notes: ${notes}`
    });

    // Trigger Automated Task: if missed/no-answer, auto-schedule follow-up task
    if (['missed', 'busy', 'no-answer'].includes(status)) {
      await triggerAutomatedTask({
        title: `Redial missed contact`,
        description: `Follow-up needed after call result: ${status}`,
        assignedTo: req.user._id,
        clientType: call.clientType,
        clientId: call.clientId
      });
    }

    // Update AI Summary
    await updateAISummaryStats(call.clientId, call.clientType, {
      meetingSummary: `Latest Call Notes: ${notes}`
    });

    res.status(201).json(call);
  } catch (err) {
    next(err);
  }
};

// @desc    Get call logs
// @route   GET /api/calls
// @access  Private
const getCallLogs = async (req, res, next) => {
  try {
    const list = await CallLog.find({ userId: req.user._id }).sort({ timestamp: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule Meeting
// @route   POST /api/meetings
// @access  Private
const scheduleMeeting = async (req, res, next) => {
  const { meetingType, date, time, location, conferenceLink, participants, notes, agenda, clientType, clientId, projectId } = req.body;

  try {
    const meet = await Meeting.create({
      meetingType: meetingType || 'Consultation',
      date,
      time,
      location: location || '',
      conferenceLink: conferenceLink || '',
      participants: participants || [],
      notes: notes || '',
      agenda: agenda || '',
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Log Index Communication
    await Communication.create({
      clientType: meet.clientType,
      clientId: meet.clientId,
      projectId: meet.projectId,
      userId: req.user._id,
      type: 'meeting',
      refId: meet._id,
      summary: `Meeting scheduled: ${meet.meetingType}`
    });

    // Write to Timeline
    await logTimeline({
      clientType: meet.clientType,
      clientId: meet.clientId,
      projectId: meet.projectId,
      userId: req.user._id,
      activityType: 'Meeting Scheduled',
      description: `New meeting scheduled: ${meet.meetingType} on ${new Date(date).toLocaleDateString()} at ${time}`
    });

    // Trigger Automated Task: create preparation task
    await triggerAutomatedTask({
      title: `Prepare VR files for ${meet.meetingType}`,
      description: `Gather floor plans and drawings for meeting scheduled on ${new Date(date).toLocaleDateString()}`,
      assignedTo: req.user._id,
      clientType: meet.clientType,
      clientId: meet.clientId
    });

    // Update AI Summary
    await updateAISummaryStats(meet.clientId, meet.clientType, {
      meetingSummary: `Upcoming Meeting: ${meet.meetingType} on ${new Date(date).toLocaleDateString()}`,
      nextAction: `Conduct VR Session`
    });

    // Notify admins
    await dispatchNotificationsToAdmins(
      'Meeting Scheduled',
      `${req.user.name} scheduled a new meeting: "${meet.meetingType}"`,
      '/calendar'
    );

    res.status(201).json(meet);
  } catch (err) {
    next(err);
  }
};

// @desc    Get meetings list
// @route   GET /api/meetings
// @access  Private
const getMeetings = async (req, res, next) => {
  try {
    const list = await Meeting.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Create internal note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  const { type, text, clientType, clientId, projectId } = req.body;

  try {
    const note = await Note.create({
      type: type || 'Sales',
      text,
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Note index creation
    await Communication.create({
      clientType: note.clientType,
      clientId: note.clientId,
      projectId: note.projectId,
      userId: req.user._id,
      type: 'note',
      refId: note._id,
      summary: `[Internal Note] ${text.substring(0, 60)}`
    });

    // Write to Timeline
    await logTimeline({
      clientType: note.clientType,
      clientId: note.clientId,
      projectId: note.projectId,
      userId: req.user._id,
      activityType: 'Note Created',
      description: `Internal Note added: ${text}`
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

// @desc    Get Notes (Role-based Operational Check)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const { clientType, clientId } = req.query;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
      if (clientType) filter.clientType = clientType;
    }

    // Architects see Architect Notes, PMs see Project Notes, Admins see everything
    const notes = await Note.find(filter)
      .populate('userId', 'name role')
      .sort({ createdAt: -1 });

    const filtered = notes.filter((n) => {
      if (req.user.role === 'founder' || req.user.role === 'admin') return true;
      if (req.user.role === 'architect' && n.type === 'Architect') return true;
      if (req.user.role === 'manager' && ['Project', 'Manager'].includes(n.type)) return true;
      if (req.user.role === 'rep' && n.type === 'Sales') return true;
      return false;
    });

    res.json(filtered);
  } catch (err) {
    next(err);
  }
};

// @desc    Get unified timeline
// @route   GET /api/timeline
// @access  Private
const getTimeline = async (req, res, next) => {
  try {
    const { clientId, clientType, projectId } = req.query;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
      if (clientType) filter.clientType = clientType;
    }
    if (projectId) filter.projectId = projectId;

    const list = await ActivityTimeline.find(filter)
      .populate('userId', 'name role')
      .sort({ timestamp: -1 });

    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Create Feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res, next) => {
  const { rating, feedbackType, comments, revisionRequests, clientType, clientId, projectId } = req.body;

  try {
    const fb = await Feedback.create({
      rating,
      feedbackType,
      comments: comments || '',
      revisionRequests: revisionRequests || [],
      clientType: clientType || 'Lead',
      clientId,
      projectId,
      userId: req.user._id
    });

    // Communication Index log
    await Communication.create({
      clientType: fb.clientType,
      clientId: fb.clientId,
      projectId: fb.projectId,
      userId: req.user._id,
      type: 'note',
      refId: fb._id,
      summary: `Feedback rating: ${rating}/5, category: ${feedbackType}`
    });

    // Prepend to timeline
    await logTimeline({
      clientType: fb.clientType,
      clientId: fb.clientId,
      projectId: fb.projectId,
      userId: req.user._id,
      activityType: 'Feedback Received',
      description: `Client left feedback rating: ${rating}/5. Category: ${feedbackType}. Comments: ${comments}`
    });

    // Trigger Automated Task: if revision requests, create Architect Task
    if (revisionRequests && revisionRequests.length > 0) {
      const architectUser = await User.findOne({ role: 'architect', isActive: true });
      if (architectUser) {
        await triggerAutomatedTask({
          title: `Address client revisions: ${feedbackType}`,
          description: `Client requested: ${revisionRequests.join(', ')}`,
          assignedTo: architectUser._id,
          clientType: fb.clientType,
          clientId: fb.clientId
        });
      }
    }

    // Update AI Summary Scores
    const satisfactionScore = rating * 20; // convert 1-5 to 0-100
    await updateAISummaryStats(fb.clientId, fb.clientType, {
      clientSatisfactionScore: satisfactionScore,
      nextBestAction: 'Review revision files'
    });

    res.status(201).json(fb);
  } catch (err) {
    next(err);
  }
};

// @desc    Get Feedback
// @route   GET /api/feedback
// @access  Private
const getFeedback = async (req, res, next) => {
  try {
    const list = await Feedback.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI Summary
// @route   GET /api/ai-summary
// @access  Private
const getAiSummary = async (req, res, next) => {
  try {
    const { clientId, clientType } = req.query;
    let summary = await AISummary.findOne({ clientId, clientType });
    if (!summary) {
      // Mock generate initial values
      summary = await AISummary.create({
        clientId,
        clientType: clientType || 'Lead',
        budget: 15000000,
        services: ['VR Walkthrough', 'Interior Visualization'],
        meetingSummary: 'No meetings scheduled yet.',
        projectCompletion: 10,
        pendingApprovals: ['Showroom slot booking'],
        nextAction: 'Establish contact call',
        projectHealthScore: 85,
        delayPrediction: 'Low Risk',
        clientSatisfactionScore: 90,
        nextBestAction: 'Log first conversation log',
        executiveSuggestions: ['Schedule CRM onboarding demonstration.']
      });
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

// @desc    Client portal timeline access
// @route   GET /api/client-portal/communication
// @access  Public
const getClientTimeline = async (req, res, next) => {
  try {
    const { clientId, clientType } = req.query;
    if (!clientId) {
      res.status(400);
      return next(new Error('clientId is required'));
    }

    // Fetch timeline logs but hide note creations (since notes are internal notes)
    const list = await ActivityTimeline.find({
      clientId,
      clientType: clientType || 'Lead',
      activityType: { $ne: 'Note Created' }
    }).sort({ timestamp: -1 });

    res.json(list);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCommunicationList,
  sendEmail,
  getEmails,
  sendWhatsappMessage,
  getWhatsappMessages,
  logCall,
  getCallLogs,
  scheduleMeeting,
  getMeetings,
  createNote,
  getNotes,
  getTimeline,
  createFeedback,
  getFeedback,
  getAiSummary,
  getClientTimeline
};
