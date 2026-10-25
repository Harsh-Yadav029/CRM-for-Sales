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

const Event = require('../models/Event');

// @desc    Get all call recordings for QA audit & monitoring
// @route   GET /api/v1/voice/recordings (or /api/voice/recordings)
// @access  Private
const getCallRecordings = async (req, res, next) => {
  try {
    const { repId, search, disposition, startDate, endDate, limit = 50, page = 1 } = req.query;

    const query = {
      type: 'call',
      // Include all call events, prioritizing those with recordingUrl or twilioCallSid
      $or: [
        { recordingUrl: { $exists: true, $ne: '' } },
        { twilioCallSid: { $exists: true, $ne: '' } },
        { status: 'completed' }
      ]
    };

    if (repId) {
      query.assignedTo = repId;
    }

    if (disposition) {
      query.disposition = disposition;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let events = await Event.find(query)
      .populate('assignedTo', 'name email role')
      .populate({
        path: 'relatedTo.recordId',
        select: 'name company phone email status'
      })
      .sort({ startTime: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      recordings: events
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateVoiceToken,
  getCallRecordings
};

