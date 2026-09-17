'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/memberController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireSelfOrStaff } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { registerMemberSchema, updateMemberSchema, lockMemberSchema } = require('../validators/memberValidator');

// Chỉ nhân viên được xem danh sách
router.get('/', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), ctrl.list);

// B1 - Đăng ký (thu_thu+)
router.post('/', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), validate(registerMemberSchema), ctrl.register);

// Xem hồ sơ — bản thân hoặc nhân viên
router.get('/:id', authenticate, requireSelfOrStaff('id'), ctrl.getById);

// B3 - Cập nhật — bản thân hoặc nhân viên
router.put('/:id', authenticate, requireSelfOrStaff('id'), validate(updateMemberSchema), ctrl.update);

// B2 - Gia hạn thẻ (thu_thu+)
router.post('/:id/renew', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), ctrl.renewCard);

// B3-Alt1 - Khóa thẻ (thu_thu+)
router.post('/:id/lock', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), validate(lockMemberSchema), ctrl.lockCard);

// B3 - Mở khóa (quan_ly+)
router.post('/:id/unlock', authenticate, requireRole('quan_ly', 'admin'), ctrl.unlockCard);

// B4 - Hủy thẻ (quan_ly+)
router.delete('/:id', authenticate, requireRole('quan_ly', 'admin'), ctrl.cancelCard);

// D3 - Xem công nợ — bản thân hoặc nhân viên
router.get('/:id/debt', authenticate, requireSelfOrStaff('id'), ctrl.getDebt);

module.exports = router;
