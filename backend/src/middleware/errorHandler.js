'use strict';
const { AppError } = require('../utils/errors');

// HCI Nielsen #9: Thông báo lỗi cụ thể kèm hướng dẫn khắc phục
const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: `Giá trị đã tồn tại cho trường: ${field}` },
    });
  }

  // Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('; ') },
    });
  }

  // Unknown errors — don't expose internals
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' },
  });
};

const notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Không tìm thấy endpoint: ${req.path}` } });

module.exports = { errorHandler, notFoundHandler };
