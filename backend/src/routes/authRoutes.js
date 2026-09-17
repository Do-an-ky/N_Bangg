'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { staffLoginSchema, memberLoginSchema, setPasswordSchema } = require('../validators/authValidator');

// E1 - Đăng nhập
router.post('/staff/login', validate(staffLoginSchema), ctrl.staffLogin);
router.post('/member/login', validate(memberLoginSchema), ctrl.memberLogin);

// Thông tin người dùng hiện tại
router.get('/me', authenticate, ctrl.me);

// Đặt mật khẩu bạn đọc (thu_thu+)
router.put('/members/:banDocId/password', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'),
  validate(setPasswordSchema), ctrl.setPassword);

// E2: Đổi mật khẩu (tự đổi - bất kỳ user đã đăng nhập)
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
