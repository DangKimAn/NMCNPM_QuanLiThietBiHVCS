import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAccessToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

export const socket = io(API_URL, {
  auth: (cb: (data: { token: string | null }) => void) => {
    cb({ token: getAccessToken() });
  },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
