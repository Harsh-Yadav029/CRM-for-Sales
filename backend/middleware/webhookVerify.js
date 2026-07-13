const crypto = require('crypto');
const twilio = require('twilio');
const WebhookEvent = require('../models/WebhookEvent');

/**
 * Checks and registers webhook event IDs to prevent duplicate processing (idempotency).
 * @param {string} eventId 
 * @param {string} provider 
 * @returns {Promise<boolean>} True if duplicate event, false if first time and successfully logged
 */
const isDuplicateEvent = async (eventId, provider) => {
  try {
    if (!eventId) return false;
    await WebhookEvent.create({ eventId, provider });
    return false; // Unique event
  } catch (err) {
    if (err.code === 11000) {
      return true; // Duplicate key error
    }
    throw err;
  }
};

/**
 * Verifies cryptographic signatures from Nylas webhooks.
 * @param {string} signature 
 * @param {Object} body 
 * @param {string} clientSecret 
 * @returns {boolean} True if signature is valid or if running in non-production mode
 */
const verifyNylasSignature = (signature, rawBodyOrBody, clientSecret) => {
  if (!signature) return false;
  const payload = Buffer.isBuffer(rawBodyOrBody) ? rawBodyOrBody : JSON.stringify(rawBodyOrBody);
  const calculatedSignature = crypto
    .createHmac('sha256', clientSecret || 'mock_secret')
    .update(payload)
    .digest('hex');

  if (signature === calculatedSignature) {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
};

/**
 * Verifies cryptographic signatures from Twilio webhooks.
 * @param {string} signature 
 * @param {string} url 
 * @param {Object} body 
 * @param {string} authToken 
 * @returns {boolean} True if signature is valid or if running in non-production mode
 */
const verifyTwilioSignature = (signature, url, body, authToken) => {
  if (!signature) return false;
  const isValid = twilio.validateRequest(
    authToken || 'mock_token',
    signature,
    url,
    body
  );
  if (isValid) {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
};

module.exports = {
  isDuplicateEvent,
  verifyNylasSignature,
  verifyTwilioSignature
};
