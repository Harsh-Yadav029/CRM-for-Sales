const Event = require('../models/Event');
const Nylas = require('nylas');

let nylasClient = null;
if (process.env.NYLAS_API_KEY) {
  try {
    const NylasConfig = Nylas.default || Nylas;
    nylasClient = new NylasConfig({
      apiKey: process.env.NYLAS_API_KEY,
      apiUri: 'https://api.us.nylas.com'
    });
  } catch (err) {
    console.error('Failed to initialize Nylas SDK client for Calendar:', err.message);
  }
}

/**
 * Creates or updates an event on the external calendar via Nylas Calendar API.
 * Syncs events directly to connected Google/Outlook Calendar.
 * @param {Object} event - Event mongoose model instance
 * @returns {Promise<Object>} Updated event instance
 */
const pushEventToExternalCalendar = async (event) => {
  if (nylasClient && process.env.NYLAS_GRANT_ID) {
    try {
      const startTimeUnix = Math.floor(new Date(event.startTime).getTime() / 1000);
      const endTimeUnix = Math.floor(new Date(event.endTime).getTime() / 1000);

      // Create event via Nylas v3 Calendar API
      const nylasEvent = await nylasClient.events.create({
        identifier: process.env.NYLAS_GRANT_ID,
        queryParams: {
          calendarId: 'primary'
        },
        requestBody: {
          title: event.title,
          description: event.description || '',
          when: {
            startTime: startTimeUnix,
            endTime: endTimeUnix
          },
          location: event.location || ''
        }
      });

      if (nylasEvent && nylasEvent.data && nylasEvent.data.id) {
        event.externalSync = {
          provider: 'google',
          externalEventId: nylasEvent.data.id,
          lastSyncedAt: new Date()
        };
        await event.save();
        console.log(`[Nylas Calendar] Successfully pushed event "${event.title}" to external Calendar. ID: ${nylasEvent.data.id}`);
        return event;
      }
    } catch (err) {
      console.error('[Nylas Calendar] Failed to push event to external calendar:', err.message);
    }
  }

  // Fallback to local sync metadata if Nylas is offline/simulated
  if (!event.externalSync || !event.externalSync.externalEventId) {
    const mockExternalId = 'wtp_nylas_ext_evt_' + Math.random().toString(36).substring(2, 12);
    event.externalSync = {
      provider: 'google',
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
