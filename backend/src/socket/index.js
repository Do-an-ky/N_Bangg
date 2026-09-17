'use strict';
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authenticate socket connection bằng JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, userType } = socket.user;
    // Mỗi user join room riêng: "user:{id}"
    socket.join(`user:${id}`);
    if (userType === 'staff') socket.join('staff');

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  return io;
}

// Gửi thông báo đến một user cụ thể (C2/C4: bản sao sẵn sàng)
function notifyUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

// Gửi thông báo đến tất cả staff
function notifyStaff(event, data) {
  if (!io) return;
  io.to('staff').emit(event, data);
}

module.exports = { initSocket, getIO, notifyUser, notifyStaff };
