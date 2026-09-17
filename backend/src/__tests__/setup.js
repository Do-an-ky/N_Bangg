'use strict';
require('dotenv').config();
// Test setup — dùng database test riêng
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Redis để không cần Redis thật khi test
jest.mock('../config/redis', () => ({
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  quit: jest.fn(),
}));

// Mock Socket.io để test service không cần server thật
jest.mock('../socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => null),
  notifyUser: jest.fn(),
  notifyStaff: jest.fn(),
}));
