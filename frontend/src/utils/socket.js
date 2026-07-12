import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const initiateSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket) {
    if (socket.connected) return socket;
    socket.connect();
    return socket;
  }

  let queryParams = {};
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      queryParams.userId = u._id || '';
      queryParams.tenantId = u.tenantId || '';
    }
  } catch (_) {}

  socket = io(SOCKET_URL, {
    auth: { token },
    query: queryParams,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('[SocketClient] Connected to realtime gateway server');
  });

  socket.on('disconnect', (reason) => {
    console.log('[SocketClient] Disconnected from server:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[SocketClient] Connection handshake failed:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initiateSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
