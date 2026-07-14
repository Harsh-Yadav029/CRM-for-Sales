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
    const { userId } = socket.handshake.query;

    // Scope socket session to single company room
    socket.join('walktheplan');
    console.log('[Socket] Client connected to walktheplan room');

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

const emitTenantEvent = (tenantId, event, payload) => {
  if (io) {
    io.to('walktheplan').emit(event, payload);
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
