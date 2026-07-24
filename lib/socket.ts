import { io, Socket } from 'socket.io-client';

const getWsUrl = () => {
  if (typeof window !== 'undefined') {
    const envWs = process.env.NEXT_PUBLIC_WS_BASE;
    if (envWs) return envWs;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';
    return apiBase.replace(/\/api\/?$/, '');
  }
  return process.env.NEXT_PUBLIC_WS_BASE || 'https://api.tierkun.my.id';
};

const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

export const socket: Socket = io(getWsUrl(), {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  autoConnect: typeof window !== 'undefined',
  auth: {
    token: token ? `Bearer ${token}` : '',
  },
});

if (typeof window !== 'undefined') {
  socket.on('connect', () => {
    console.log('[SOCKET.IO] Connected successfully:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[SOCKET.IO] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET.IO] Disconnected:', reason);
  });
}

export const getSocket = (): Socket => socket;

export default socket;
