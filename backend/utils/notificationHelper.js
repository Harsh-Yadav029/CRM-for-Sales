const Notification = require('../models/Notification');
const { emitUserEvent } = require('./socket');

/**
 * Creates a database notification and broadcasts it in real-time if the user is online.
 * @param {Object} params - Notification parameters
 * @param {string} params.tenantId - Tenant ID scoping the alert
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.title - Alert header
 * @param {string} params.message - Alert content
 * @param {string} [params.link] - Actionable URL link
 * @returns {Promise<Object>} The created Mongoose Notification document
 */
const createNotification = async ({ tenantId, userId, title, message, link = '' }) => {
  try {
    const notification = await Notification.create({
      tenantId,
      userId,
      title,
      message,
      link
    });

    // Broadcast the notification event in real-time to the recipient's room
    emitUserEvent(userId.toString(), 'notification_received', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create or emit notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};
