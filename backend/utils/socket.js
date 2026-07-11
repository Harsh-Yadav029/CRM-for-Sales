const { Server } = require('socket.io');

let io = null;

/**
 * Initializes Socket.io server instance.
 * @param {Object} httpServer - The Node.js http server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Strict controls can be mapped using allowedOrigins if required
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    const { tenantId, userId } = socket.handshake.query;

    if (tenantId) {
      // Scope socket session to tenant-specific room
      socket.join(tenantId);
      console.log(`[Socket] Client connected to tenant room: ${tenantId}`);
    }

    if (userId) {
      // Scope socket session to user-specific room (for private in-app alerts)
      socket.join(userId);
      console.log(`[Socket] Client connected to user room: ${userId}`);
    }

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected');
    });
  });

  return io;
};

/**
 * Gets the active socket server instance.
 */
const getIO = () => {
  return io;
};

/**
 * Broadcasts an event to a specific tenant room.
 * @param {string} tenantId - Tenant identifier
 * @param {string} event - Event name
 * @param {Object} payload - Event data
 */
const emitTenantEvent = (tenantId, event, payload) => {
  if (io && tenantId) {
    io.to(tenantId).emit(event, payload);
  }
};

/**
 * Sends an event to a specific user room.
 * @param {string} userId - User identifier
 * @param {string} event - Event name
 * @param {Object} payload - Event data
 */
const emitUserEvent = (userId, event, payload) => {
  if (io && userId) {
    io.to(userId).emit(event, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitTenantEvent,
  emitUserEvent
};
