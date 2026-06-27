import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(API_URL, {
  autoConnect: true,
  // Tùy chọn: có thể cấu hình thêm các transport
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
