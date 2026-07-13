const crypto = require('crypto');
const twilio = require('twilio');
const Lead = require('../models/Lead');
const WebhookEvent = require('../models/WebhookEvent');

// Helper to check and register event IDs for idempotency
const isDuplicateEvent = async (eventId, provider) => {
  try {
    if (!eventId) return false;
    await WebhookEvent.create({ eventId, provider });
    return false; // Not a duplicate, successfully logged
  } catch (err) {
    if (err.code === 11000) {
      return true; // Duplicate key error
    }
    throw err;
  }
};

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

    if (req.user.role === 'rep' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
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

    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    res.status(201).json({
      message: 'Email dispatched successfully (Simulated)',
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate and log outbound call details to timeline
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

    if (req.user.role === 'rep' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied'));
    }

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
    const mockToken = 'mock_twilio_token_' + Math.random().toString(36).substring(2);
    res.json({
      token: mockToken,
      identity: req.user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Nylas Webhook Challenge validation (GET)
// @route   GET /api/communication/webhooks/nylas
// @access  Public
const nylasChallenge = (req, res) => {
  const challenge = req.query.challenge;
  if (challenge) {
    return res.status(200).send(challenge);
  }
  res.status(400).send('No challenge query parameter provided');
};

// @desc    Handle Inbound Nylas Webhook Updates (POST)
// @route   POST /api/communication/webhooks/nylas
// @access  Public
const nylasWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-nylas-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Nylas webhook signature header missing' });
    }

    // Verify Nylas Signature
    const calculatedSignature = crypto
      .createHmac('sha256', process.env.NYLAS_CLIENT_SECRET || 'mock_secret')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== calculatedSignature && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: 'Nylas signature verification failed' });
    }

    const { deltadata, delta } = req.body;
    const events = deltadata || delta || [];

    for (const event of events) {
      const eventId = event.id || event.message_id;
      
      // Idempotency check
      if (await isDuplicateEvent(eventId, 'nylas')) {
        continue;
      }

      // Check if it's an email created/received event
      if (event.type === 'message.created' || event.attributes?.type === 'message') {
        const fromEmail = event.attributes?.from?.[0]?.email || event.from?.[0]?.email;
        const subject = event.attributes?.subject || event.subject || 'Inbound email response';
        const body = event.attributes?.body || event.body || event.snippet || 'Inbound email contents';

        if (fromEmail) {
          // Look up lead matching the sender
          const lead = await Lead.findOne({ email: fromEmail.toLowerCase() });
          if (lead) {
            lead.notes.push({
              type: 'email',
              subject: subject,
              text: body,
              status: 'received',
              addedBy: lead.assignedTo || null
            });
            await lead.save();
          }
        }
      } else if (event.type?.startsWith('event.') || event.object === 'event') {
        const { handleInboundCalendarWebhook } = require('../services/nylasCalendarSync');
        await handleInboundCalendarWebhook(event);
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Inbound Twilio Webhook Events (SMS/WhatsApp) (POST)
// @route   POST /api/communication/webhooks/twilio
// @access  Public
const twilioWebhook = async (req, res, next) => {
  try {
    const twilioSignature = req.headers['x-twilio-signature'];
    if (!twilioSignature) {
      return res.status(401).json({ message: 'Twilio signature header missing' });
    }

    // Verify Twilio Signature
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || (req.protocol + '://' + req.get('host') + req.originalUrl);
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN || 'mock_token',
      twilioSignature,
      webhookUrl,
      req.body
    );

    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: 'Twilio signature validation failed' });
    }

    const { MessageSid, From, Body } = req.body;
    
    // Idempotency check
    if (await isDuplicateEvent(MessageSid, 'twilio')) {
      return res.status(200).send('<Response></Response>'); // Already processed
    }

    if (From && Body) {
      // Find lead matching phone (sanitize strings to perform regex suffix matching)
      const sanitizedPhone = From.replace(/\D/g, ''); // Extract digits
      const phoneSuffix = sanitizedPhone.slice(-10); // Capture last 10 digits
      
      const lead = await Lead.findOne({
        phone: new RegExp(phoneSuffix + '$')
      });

      if (lead) {
        lead.notes.push({
          type: 'note',
          text: `[Inbound SMS] ${Body}`,
          status: 'completed',
          addedBy: lead.assignedTo || null
        });
        await lead.save();
      }
    }

    // Return TwiML response
    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    next(error);
  }
};

const sendSMS = async (req, res, next) => {
  const { leadId, message } = req.body;

  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'rep' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied'));
    }

    lead.notes.push({
      type: 'note',
      text: `[Outbound SMS] ${message}`,
      status: 'completed',
      addedBy: req.user._id
    });

    await lead.save();

    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    res.status(201).json({
      message: 'SMS dispatched successfully (Simulated)',
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendEmail,
  logCall,
  sendSMS,
  getTwilioToken,
  nylasChallenge,
  nylasWebhook,
  twilioWebhook
};
