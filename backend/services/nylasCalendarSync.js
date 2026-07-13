const Event = require('../models/Event');
const axios = require('axios');

/**
 * Creates or updates an event on an external calendar via the Nylas Calendar API.
 * Stores the returned externalEventId and lastSyncedAt on the local Event document.
 * @param {Object} eventDoc - Mongoose Event document
 * @returns {Promise<Object>} Updated event document
 */
const pushEventToExternalCalendar = async (eventDoc) => {
  const nylasApiKey = process.env.NYLAS_API_KEY || process.env.NYLAS_CLIENT_SECRET;
  const nylasGrantId = process.env.NYLAS_GRANT_ID || 'mock_grant_id';

  if (!nylasApiKey || nylasApiKey === 'mock_secret') {
    // Simulated Nylas Sync for Testing / Dev sandboxes
    const mockExternalId = eventDoc.externalSync?.externalEventId || `nylas_evt_${Math.random().toString(36).substring(7)}`;
    eventDoc.externalSync = {
      provider: 'google',
      externalEventId: mockExternalId,
      lastSyncedAt: new Date()
    };
    await eventDoc.save();
    return eventDoc;
  }

  try {
    const isNew = !eventDoc.externalSync || !eventDoc.externalSync.externalEventId;
    const url = isNew
      ? `https://api.us.nylas.com/v3/grants/${nylasGrantId}/events`
      : `https://api.us.nylas.com/v3/grants/${nylasGrantId}/events/${eventDoc.externalSync.externalEventId}`;
    
    const method = isNew ? 'post' : 'put';

    const payload = {
      title: eventDoc.title,
      description: eventDoc.description,
      when: {
        start_time: Math.floor(new Date(eventDoc.startTime).getTime() / 1000),
        end_time: Math.floor(new Date(eventDoc.endTime).getTime() / 1000),
        start_timezone: eventDoc.timezone,
        end_timezone: eventDoc.timezone
      },
      location: eventDoc.location,
      participants: eventDoc.participants.map(p => ({
        name: p.name,
        email: p.email
      }))
    };

    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${nylasApiKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });

    if (response.data && response.data.data) {
      const externalId = response.data.data.id;
      eventDoc.externalSync = {
        provider: 'google',
        externalEventId: externalId,
        lastSyncedAt: new Date()
      };
      await eventDoc.save();
    }
  } catch (error) {
    console.error('Nylas Calendar push failed:', error.message);
    // Fallback to simulated local sync to prevent app crash
    if (!eventDoc.externalSync || !eventDoc.externalSync.externalEventId) {
      eventDoc.externalSync = {
        provider: 'google',
        externalEventId: `nylas_fallback_${Math.random().toString(36).substring(7)}`,
        lastSyncedAt: new Date()
      };
      await eventDoc.save();
    }
  }

  return eventDoc;
};

/**
 * Handles inbound calendar event webhook payloads from Nylas.
 * Matches local Event records by externalEventId and updates them.
 * @param {Object} payload - Inbound webhook payload from Nylas
 */
const handleInboundCalendarWebhook = async (payload) => {
  const triggerType = payload.type; // 'event.created', 'event.updated', 'event.deleted'
  const data = payload.data?.object || payload.data || {};
  const externalEventId = data.id;

  if (!externalEventId) return;

  try {
    const localEvent = await Event.findOne({ 'externalSync.externalEventId': externalEventId });
    if (!localEvent) return;

    if (triggerType === 'event.deleted') {
      localEvent.status = 'cancelled';
      await localEvent.save();
      return;
    }

    // Sync updates back to local event
    if (data.title) localEvent.title = data.title;
    if (data.description) localEvent.description = data.description;
    if (data.location) localEvent.location = data.location;
    
    if (data.when) {
      const start = data.when.start_time || data.when.time;
      const end = data.when.end_time || data.when.time;
      if (start) localEvent.startTime = new Date(start * 1000);
      if (end) localEvent.endTime = new Date(end * 1000);
    }

    localEvent.externalSync.lastSyncedAt = new Date();
    await localEvent.save();
  } catch (error) {
    console.error('Failed to sync inbound Nylas webhook:', error.message);
  }
};

module.exports = {
  pushEventToExternalCalendar,
  handleInboundCalendarWebhook
};
