'use strict';
const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const v = require('../validators/documentValidator');

const staff = authenticate;
const libStaff = requireRole('thu_thu', 'quan_ly', 'admin');
const manager = requireRole('quan_ly', 'admin');

// ─── Phải đặt static routes TRƯỚC /:id để tránh Express nhầm ─────────────────

// ── A5: Nhà cung cấp ─────────────────────────────────────────────────────────
router.get('/suppliers', staff, libStaff, ctrl.listSuppliers);
router.post('/suppliers', staff, manager, validate(v.supplierSchema), ctrl.createSupplier);
router.put('/suppliers/:id', staff, manager, validate(v.supplierSchema), ctrl.updateSupplier);

// ── A5: Đơn đặt hàng ─────────────────────────────────────────────────────────
router.get('/orders', staff, libStaff, ctrl.listOrders);
router.post('/orders', staff, libStaff, validate(v.createOrderSchema), ctrl.createOrder);
router.post('/orders/:id/approve', staff, manager, ctrl.approveOrder);
router.post('/orders/:id/receive', staff, libStaff, ctrl.receiveOrder);
router.post('/orders/:id/cancel', staff, manager,
  validate(Joi.object({ lyDo: Joi.string().min(5).required() })),
  ctrl.cancelOrder);

// ── Kiểm kê ──────────────────────────────────────────────────────────────────
router.get('/inventory', staff, libStaff, ctrl.listInventory);
router.post('/inventory', staff, libStaff, ctrl.startInventory);
router.get('/inventory/:id', staff, libStaff, ctrl.getInventory);
router.post('/inventory/:id/items', staff, libStaff, validate(v.recordItemSchema), ctrl.recordItem);
router.post('/inventory/:id/finish', staff, manager, ctrl.finishInventory);

// ── Tài liệu ─────────────────────────────────────────────────────────────────
router.get('/', staff, libStaff, ctrl.listDocuments);
router.post('/', staff, libStaff, validate(v.createDocumentSchema), ctrl.createDocument);

// Bản sao — /:id/copies trước /:id để tránh conflict
router.get('/:id/copies', staff, libStaff, ctrl.getCopies);
router.post('/:id/copies', staff, libStaff, validate(v.addCopiesSchema), ctrl.addCopies);
router.delete('/:id/copies/:banSaoId', staff, manager, validate(v.discardCopySchema), ctrl.discardCopy);

// A2: Biên mục
router.post('/:id/catalog', staff, libStaff, validate(v.catalogDocumentSchema), ctrl.catalogDocument);

// A4-Alt1: Ngừng lưu thông (quan_ly+)
router.post('/:id/stop-circulation', staff, manager, ctrl.stopCirculation);

// A3: Cập nhật / Xem chi tiết
router.get('/:id', staff, libStaff, ctrl.getDocument);
router.put('/:id', staff, libStaff, validate(v.updateDocumentSchema), ctrl.updateDocument);

module.exports = router;
