'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/circulationController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole, requireMemberOrStaff } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createReservationSchema, checkoutSchema, returnSchema,
  reportLostSchema, waiveFineSchema,
} = require('../validators/circulationValidator');

// ── C1: Tra cứu (public, nhưng bạn đọc thấy thêm thông tin) ─────────────────
router.get('/books', optionalAuth, ctrl.searchBooks);
router.get('/books/:id', optionalAuth, ctrl.getBookDetail);

// ── C2: Đặt trước ────────────────────────────────────────────────────────────
// Bạn đọc tự đặt hoặc nhân viên đặt giúp
router.post('/reservations', authenticate, requireMemberOrStaff, validate(createReservationSchema), ctrl.createReservation);
router.delete('/reservations/:id', authenticate, requireMemberOrStaff, ctrl.cancelReservation);
// Xem đặt trước của mình
router.get('/members/:banDocId/reservations', authenticate, ctrl.getMyReservations);

// ── C3: Mượn tài liệu (thu_thu+) ─────────────────────────────────────────────
router.post('/loans', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'),
  validate(checkoutSchema), ctrl.checkoutBook);

// ── C4: Trả tài liệu (thu_thu+) ───────────────────────────────────────────────
router.post('/returns', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'),
  validate(returnSchema), ctrl.returnBook);

// ── C5: Gia hạn — bạn đọc hoặc nhân viên ────────────────────────────────────
router.post('/loans/:id/renew', authenticate, requireMemberOrStaff, ctrl.renewLoan);

// ── C7: Báo mất/hư hỏng (thu_thu+) ──────────────────────────────────────────
router.post('/loans/:id/report', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'),
  validate(reportLostSchema), ctrl.reportLostDamaged);

// ── Lịch sử mượn ─────────────────────────────────────────────────────────────
// Danh sách tất cả phiếu mượn (staff, static route trước /:id)
router.get('/loans', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), ctrl.listLoans);
router.get('/loans/:id', authenticate, ctrl.getLoanDetail);
router.get('/members/:banDocId/loans', authenticate, ctrl.getLoansByMember);

// ── D1: Thu phạt / miễn giảm (thu_thu+) ─────────────────────────────────────
router.post('/fines/:id/pay', authenticate, requireRole('thu_thu', 'quan_ly', 'admin'), ctrl.payFine);
router.post('/fines/:id/waive', authenticate, requireRole('quan_ly', 'admin'), validate(waiveFineSchema), ctrl.waiveFine);

module.exports = router;
