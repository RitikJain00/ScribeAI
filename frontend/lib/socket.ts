import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  
  socket = io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[v0] Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[v0] Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[v0] Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitAudioChunk = (blob: Blob) => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('audio-chunk', blob);
  }
};

export const onTranscript = (callback: (text: string) => void) => {
  const socket = getSocket();
  socket.on('transcript', callback);
  return () => socket.off('transcript', callback);
};

export const onProcessing = (callback: () => void) => {
  const socket = getSocket();
  socket.on('processing', callback);
  return () => socket.off('processing', callback);
};

export const onCompleted = (callback: () => void) => {
  const socket = getSocket();
  socket.on('completed', callback);
  return () => socket.off('completed', callback);
};
