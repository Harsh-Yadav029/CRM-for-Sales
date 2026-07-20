const twilio = require('twilio');
const Event = require('../models/Event');
const { verifyTwilioSignature } = require('../middleware/webhookVerify');

// @desc    TwiML app route to connect outbound call from browser
// @route   POST /api/v1/voice/twiml
// @access  Public
const handleOutboundCall = async (req, res, next) => {
  try {
    const twilioSignature = req.headers['x-twilio-signature'];
    if (!twilioSignature) {
      return res.status(401).send('Unauthorized: Signature missing');
    }

    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || (req.protocol + '://' + req.get('host') + req.originalUrl);
    const isTwilioValid = verifyTwilioSignature(
      twilioSignature,
      webhookUrl,
      req.body,
      process.env.TWILIO_AUTH_TOKEN
    );

    if (!isTwilioValid) {
      return res.status(401).send('Unauthorized: Invalid signature');
    }

    const { CallSid, To, number, eventId } = req.body;
    const destinationNumber = number || To;

    if (!destinationNumber) {
      const response = new twilio.twiml.VoiceResponse();
      response.say('Error: No destination number provided.');
      res.type('text/xml');
      return res.send(response.toString());
    }

    // Link Twilio CallSid to the Event record if eventId is provided
    if (eventId) {
      await Event.findByIdAndUpdate(eventId, { twilioCallSid: CallSid });
    }

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    const host = req.get('host');
    const protocol = req.protocol;
    const statusCallbackUrl = `${protocol}://${host}/api/v1/webhooks/twilio/call-status`;
    const recordingCallbackUrl = `${protocol}://${host}/api/v1/webhooks/twilio/recording`;

    const dial = response.dial({
      record: 'record-from-answer',
      callerId: process.env.TWILIO_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: 'POST',
      recordingStatusCallback: recordingCallbackUrl,
      recordingStatusCallbackMethod: 'POST'
    });

    dial.number(destinationNumber);

    res.type('text/xml');
    res.send(response.toString());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleOutboundCall
};
