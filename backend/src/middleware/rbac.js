'use strict';
const { ForbiddenError } = require('../utils/errors');

// E1: Role-Based Access Control
// JWT payload: { id, role, userType: 'staff' | 'member' }

const requireStaff = (req, res, next) => {
  if (!req.user || req.user.userType !== 'staff') return next(new ForbiddenError());
  next();
};

// requireRole('quan_ly', 'admin') — staff must have one of these roles
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || req.user.userType !== 'staff' || !roles.includes(req.user.role)) {
    return next(new ForbiddenError());
  }
  next();
};

// Allow member (OPAC actions) or staff (counter actions)
const requireMemberOrStaff = (req, res, next) => {
  if (!req.user) return next(new ForbiddenError());
  next();
};

// Allow only the member themselves or staff
const requireSelfOrStaff = (paramKey = 'id') => (req, res, next) => {
  if (!req.user) return next(new ForbiddenError());
  if (req.user.userType === 'staff') return next();
  if (req.user.userType === 'member' && String(req.user.id) === String(req.params[paramKey])) return next();
  return next(new ForbiddenError());
};

module.exports = { requireStaff, requireRole, requireMemberOrStaff, requireSelfOrStaff };
