const { Server } = require('socket.io');

let io = null;

/**
 * Initializes Socket.io server instance.
 * @param {Object} httpServer - The Node.js http server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const clean = origin.replace(/\/$/, '');
        if (clean.endsWith('.vercel.app') || clean.includes('localhost') || clean === process.env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive socket connection fallback
        }
      },
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

const emitCompanyEvent = (event, payload) => {
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
  emitCompanyEvent,
  emitUserEvent
};
