// Phase 6: Socket.io client hook
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:5000';

let sharedSocket = null;

export function useSocket(token, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;

    // Tái sử dụng socket nếu đã kết nối
    if (!sharedSocket || sharedSocket.disconnected) {
      sharedSocket = io(SOCKET_URL, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    const socket = sharedSocket;

    // Đăng ký các sự kiện
    const events = Object.keys(handlersRef.current);
    events.forEach((event) => {
      socket.on(event, (data) => handlersRef.current[event]?.(data));
    });

    return () => {
      events.forEach((event) => socket.off(event));
    };
  }, [token]);

  const emit = useCallback((event, data) => {
    if (sharedSocket?.connected) sharedSocket.emit(event, data);
  }, []);

  return { emit };
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
