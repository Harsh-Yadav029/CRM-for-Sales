const Lead = require('../models/Lead');

// @desc    Send outgoing email to a lead & log to timeline
// @route   POST /api/communication/email
// @access  Private
const sendEmail = async (req, res, next) => {
  const { leadId, subject, body } = req.body;

  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    // Check sales role authorization
    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied'));
    }

    if (!subject || !body) {
      res.status(400);
      return next(new Error('Subject and body are required'));
    }

    // Log the communication as an activity in the timeline
    lead.notes.push({
      type: 'email',
      text: body,
      subject: subject,
      status: 'sent',
      addedBy: req.user._id
    });

    await lead.save();

    // Fetch updated lead with populated addedBy info for response
    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    // Simulate sending email success
    res.status(201).json({
      message: 'Email dispatched successfully (Simulated)',
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate and logTwilio outbound call details to timeline
// @route   POST /api/communication/call
// @access  Private
const logCall = async (req, res, next) => {
  const { leadId, duration, status, notes } = req.body;

  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied'));
    }

    // Add call details to activity timeline
    lead.notes.push({
      type: 'call',
      text: notes || `Outbound VoIP call to ${lead.phone}`,
      duration: duration || 0,
      status: status || 'completed',
      addedBy: req.user._id
    });

    await lead.save();

    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    res.status(201).json({
      message: 'Call session logged successfully',
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate fetching Twilio Capability Token
// @route   GET /api/communication/twilio-token
// @access  Private
const getTwilioToken = async (req, res, next) => {
  try {
    // Generate a mock JWT for Twilio Device SDK client verification
    const mockToken = 'mock_twilio_token_' + Math.random().toString(36).substring(2);
    res.json({
      token: mockToken,
      identity: req.user.email
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendEmail,
  logCall,
  getTwilioToken
};
