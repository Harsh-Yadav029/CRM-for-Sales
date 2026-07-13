const Event = require('../models/Event');

/**
 * Creates or updates an event on the external calendar via Nylas Calendar API.
 * In development, we simulate the Nylas integration and store a mock externalEventId.
 * @param {Object} event - Event mongoose model instance
 * @returns {Promise<Object>} Updated event instance
 */
const pushEventToExternalCalendar = async (event) => {
  // If event already has externalEventId, it's an update, otherwise it's a create
  if (!event.externalSync || !event.externalSync.externalEventId) {
    const mockExternalId = 'wtp_nylas_ext_evt_' + Math.random().toString(36).substring(2, 12);
    event.externalSync = {
      provider: 'google', // Default sync target provider
      externalEventId: mockExternalId,
      lastSyncedAt: new Date()
    };
    await event.save();
  } else {
    event.externalSync.lastSyncedAt = new Date();
    await event.save();
  }
  return event;
};

/**
 * Handles inbound calendar event updates sent by Nylas Webhooks.
 * Validates existence, maps fields, and updates local records to keep sync state two-way.
 * @param {Object} payload - Webhook event payload item
 * @returns {Promise<boolean>} True if successfully processed
 */
const handleInboundCalendarWebhook = async (payload) => {
  const { eventId, type, attributes } = payload;
  if (!eventId) return false;

  // Find local event matching externalEventId
  const event = await Event.findOne({ 'externalSync.externalEventId': eventId });
  if (!event) return false;

  if (type === 'event.deleted') {
    event.status = 'cancelled';
    await event.save();
    return true;
  }

  if (type === 'event.updated' || type === 'event.created') {
    if (attributes) {
      if (attributes.title) event.title = attributes.title;
      if (attributes.description) event.description = attributes.description;
      if (attributes.startTime) event.startTime = new Date(attributes.startTime);
      if (attributes.endTime) event.endTime = new Date(attributes.endTime);
      if (attributes.location) event.location = attributes.location;
      if (attributes.status) {
        event.status = attributes.status === 'cancelled' ? 'cancelled' : 'scheduled';
      }
    }
    event.externalSync.lastSyncedAt = new Date();
    await event.save();
    return true;
  }

  return false;
};

module.exports = {
  pushEventToExternalCalendar,
  handleInboundCalendarWebhook
};
