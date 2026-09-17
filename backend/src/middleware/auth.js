'use strict';
const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');

// Verify JWT — supports both staff & member tokens
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next(new AuthError());

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new AuthError());
  }
};

// Optional auth — attach user if token present, don't fail if absent
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
};

module.exports = { authenticate, optionalAuth };
