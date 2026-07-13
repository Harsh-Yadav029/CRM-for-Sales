const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// @desc    Generate Twilio Voice Access Token for user browser client
// @route   POST /api/v1/voice/token
// @access  Private
const generateVoiceToken = async (req, res, next) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      res.status(500);
      return next(new Error('Twilio Voice environment variables are missing'));
    }

    // Short-lived voice access token (1 hour) using user's _id as identity
    const identity = req.user._id.toString();
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });

    token.addGrant(voiceGrant);
    const jwt = token.toJwt();

    res.status(200).json({ token: jwt, identity });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateVoiceToken
};
