'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const staff = authenticate;
const anyStaff = requireRole('thu_thu', 'quan_ly', 'admin');
const manager = requireRole('quan_ly', 'admin');

// Dashboard — mọi nhân viên
router.get('/dashboard', staff, anyStaff, ctrl.getDashboard);

// F1: Thống kê mượn/trả
router.get('/loans', staff, anyStaff, ctrl.getLoanStats);

// F2: Thống kê tài liệu
router.get('/documents', staff, anyStaff, ctrl.getDocumentStats);

// F3: Thống kê bạn đọc
router.get('/members', staff, anyStaff, ctrl.getMemberStats);

// F4: Phiếu phạt / công nợ (quan_ly+)
router.get('/fines', staff, manager, ctrl.getFineStats);

// F4: Báo cáo kiểm kê
router.get('/inventory/:id', staff, anyStaff, ctrl.getInventoryReport);

module.exports = router;
