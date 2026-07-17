// plugins/socket.client.ts — Socket.io client plugin for Nuxt 3
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const apiBase: string = (config.public.apiBase as string) || 'https://gaskan-api.smtijogja.my.id';

  // Extract WS base from apiBase (replace http with ws)
  const wsBase = apiBase.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
  const wsUrl = apiBase.startsWith('https') ? `https://${wsBase}` : `http://${wsBase}`;

  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to server:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[SOCKET] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected:', reason);
  });

  // Provide $socket globally
  nuxtApp.provide('socket', socket);
});

export { socket };
