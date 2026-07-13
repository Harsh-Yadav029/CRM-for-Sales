const Event = require('../models/Event');
const { verifyTwilioSignature, isDuplicateEvent } = require('../middleware/webhookVerify');

// @desc    Handle Twilio call status callbacks (ringing, in-progress, completed, etc.)
// @route   POST /api/v1/webhooks/twilio/call-status
// @access  Public
const handleCallStatus = async (req, res, next) => {
  try {
    const twilioSignature = req.headers['x-twilio-signature'];
    if (!twilioSignature) {
      return res.status(401).json({ message: 'Twilio signature header missing' });
    }

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

    const { CallSid, CallStatus, CallDuration, SequenceNumber } = req.body;

    // Idempotency check on (CallSid + SequenceNumber) or just CallSid + CallStatus
    const idempotencyKey = `${CallSid}-${CallStatus}-${SequenceNumber || 0}`;
    const isDuplicate = await isDuplicateEvent(idempotencyKey, 'twilio-voice-status');
    if (isDuplicate) {
      return res.status(200).send('<Response></Response>');
    }

    // Find the event associated with the CallSid
    const event = await Event.findOne({ twilioCallSid: CallSid });
    if (event) {
      if (CallStatus === 'completed') {
        event.status = 'completed';
        if (CallDuration) {
          event.recordingDuration = parseInt(CallDuration, 10);
        }
      } else if (CallStatus === 'canceled' || CallStatus === 'failed' || CallStatus === 'busy') {
        event.status = 'cancelled';
      }
      await event.save();
    }

    res.status(200).send('<Response></Response>');
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Twilio call recording callbacks
// @route   POST /api/v1/webhooks/twilio/recording
// @access  Public
const handleCallRecording = async (req, res, next) => {
  try {
    const twilioSignature = req.headers['x-twilio-signature'];
    if (!twilioSignature) {
      return res.status(401).json({ message: 'Twilio signature header missing' });
    }

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

    const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = req.body;

    // Idempotency check on RecordingSid
    const isDuplicate = await isDuplicateEvent(RecordingSid, 'twilio-voice-recording');
    if (isDuplicate) {
      return res.status(200).send('<Response></Response>');
    }

    const event = await Event.findOne({ twilioCallSid: CallSid });
    if (event) {
      event.recordingUrl = RecordingUrl;
      if (RecordingDuration) {
        event.recordingDuration = parseInt(RecordingDuration, 10);
      }
      await event.save();
    }

    res.status(200).send('<Response></Response>');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCallStatus,
  handleCallRecording
};
