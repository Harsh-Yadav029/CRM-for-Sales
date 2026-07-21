const crypto = require('crypto');
const twilio = require('twilio');
const Nylas = require('nylas');
const Lead = require('../models/Lead');
const WebhookEvent = require('../models/WebhookEvent');
const { isDuplicateEvent, verifyNylasSignature, verifyTwilioSignature } = require('../middleware/webhookVerify');

let nylasClient = null;
if (process.env.NYLAS_API_KEY) {
  try {
    const NylasConfig = Nylas.default || Nylas;
    nylasClient = new NylasConfig({
      apiKey: process.env.NYLAS_API_KEY,
      apiUri: 'https://api.us.nylas.com'
    });
  } catch (err) {
    console.error('Failed to initialize Nylas SDK client:', err.message);
  }
}

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

    // Send real email via Nylas if configured
    let dispatchedReal = false;
    if (nylasClient && process.env.NYLAS_GRANT_ID) {
      try {
        await nylasClient.messages.send({
          identifier: process.env.NYLAS_GRANT_ID,
          requestBody: {
            to: [{ email: lead.email, name: lead.name || 'Lead' }],
            subject: subject,
            body: body
          }
        });
        dispatchedReal = true;
        console.log(`[Nylas] Real email sent to ${lead.email} using Grant ID.`);
      } catch (nylasErr) {
        console.error('[Nylas] Outbound email dispatch failed:', nylasErr.message);
      }
    }

    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    res.status(201).json({
      message: dispatchedReal 
        ? 'Email dispatched successfully via Nylas' 
        : 'Email dispatched successfully (Simulated)',
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

// @desc    Generate real Twilio Voice Access Token for browser client
// @route   GET /api/communication/twilio-token
// @access  Private
const getTwilioToken = async (req, res, next) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      return next(new Error('Twilio Voice environment variables are missing'));
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const identity = req.user.email.replace(/[^a-zA-Z0-9_]/g, '_');
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity, ttl: 14400 });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });

    token.addGrant(voiceGrant);

    res.json({
      token: token.toJwt(),
      identity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send real SMS text message via Twilio API
// @route   POST /api/communication/sms
// @access  Private
const sendSMS = async (req, res, next) => {
  const { leadId, to, message } = req.body;

  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    let rawPhone = to || lead.phone;
    if (!rawPhone || !message) {
      res.status(400);
      return next(new Error('Recipient phone and message body are required'));
    }

    // Sanitize phone number format (remove spaces, parentheses, dashes)
    const recipientPhone = rawPhone.replace(/[\s\-\(\)]/g, '');

    let twilioMsgSid = null;
    let dispatched = false;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const sent = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipientPhone
        });
        twilioMsgSid = sent.sid;
        dispatched = true;
        console.log(`[Twilio SMS] Real SMS sent to ${recipientPhone}. SID: ${sent.sid}`);
      } catch (twErr) {
        console.error('[Twilio SMS] Dispatch error:', twErr.message);
      }
    }

    // Log SMS to lead timeline notes
    lead.notes.push({
      type: 'sms',
      text: message,
      status: dispatched ? 'sent' : 'failed',
      addedBy: req.user._id
    });

    await lead.save();

    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    res.status(201).json({
      message: dispatched ? 'SMS sent successfully via Twilio' : 'SMS logged (Simulated)',
      sid: twilioMsgSid,
      lead: updatedLead
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
    const isNylasValid = verifyNylasSignature(
      signature,
      req.rawBody || req.body,
      process.env.NYLAS_CLIENT_SECRET
    );

    if (!isNylasValid) {
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
    const isTwilioValid = verifyTwilioSignature(
      twilioSignature,
      webhookUrl,
      req.body,
      process.env.TWILIO_AUTH_TOKEN
    );

    if (!isTwilioValid) {
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


module.exports = {
  sendEmail,
  logCall,
  sendSMS,
  getTwilioToken,
  nylasChallenge,
  nylasWebhook,
  twilioWebhook
};
