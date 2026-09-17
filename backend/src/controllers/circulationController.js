'use strict';
const svc = require('../services/circulationService');
const { ok, created, paginated } = require('../utils/response');

// C1 - Tra cứu tài liệu
async function searchBooks(req, res, next) {
  try {
    const { q, theLoai, loaiTaiLieu, trangThai, page, limit } = req.query;
    const result = await svc.searchBooks({ q, theLoai, loaiTaiLieu, trangThai, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

async function getBookDetail(req, res, next) {
  try {
    const book = await svc.getBookDetail(req.params.id);
    ok(res, book);
  } catch (e) { next(e); }
}

// C2 - Đặt trước tài liệu
async function createReservation(req, res, next) {
  try {
    const { taiLieuId } = req.body;
    const banDocId = req.user.userType === 'member' ? req.user.id : req.body.banDocId;
    const result = await svc.createReservation(banDocId, taiLieuId);
    created(res, result, 'Đặt trước tài liệu thành công');
  } catch (e) { next(e); }
}

// C2-Alt1 - Hủy đặt trước
async function cancelReservation(req, res, next) {
  try {
    const banDocId = req.user.userType === 'member' ? req.user.id : null;
    const result = await svc.cancelReservation(req.params.id, banDocId);
    ok(res, result, 'Hủy đặt trước thành công');
  } catch (e) { next(e); }
}

// C3 - Mượn tài liệu
async function checkoutBook(req, res, next) {
  try {
    const { banDocId, maBanSao } = req.body;
    const result = await svc.checkoutBook(banDocId, maBanSao, req.user.id, req.ip);
    created(res, result, `Mượn tài liệu thành công. Ngày hẹn trả: ${result.ngayHenTra}`);
  } catch (e) { next(e); }
}

// C4 - Trả tài liệu
async function returnBook(req, res, next) {
  try {
    const { maBanSao, tinhTrang } = req.body;
    const result = await svc.returnBook(maBanSao, req.user.id, tinhTrang, req.ip);
    const msg = result.isLate
      ? `Trả trễ ${result.fine?.so_ngay_tre || 0} ngày. Phiếu phạt đã được tạo.`
      : 'Trả tài liệu thành công đúng hạn';
    ok(res, result, msg);
  } catch (e) { next(e); }
}

// C5 - Gia hạn thời gian mượn
async function renewLoan(req, res, next) {
  try {
    const isStaff = req.user.userType === 'staff';
    const requesterId = isStaff ? null : req.user.id;
    const result = await svc.renewLoan(req.params.id, requesterId, isStaff);
    ok(res, result, `Gia hạn thành công. Ngày hẹn trả mới: ${result.ngay_hen_tra}`);
  } catch (e) { next(e); }
}

// C7 - Báo mất / hư hỏng
async function reportLostDamaged(req, res, next) {
  try {
    const { loai } = req.body; // 'bao_mat' | 'bao_hong'
    const result = await svc.reportLostDamaged(req.params.id, loai, req.user.id, req.ip);
    ok(res, result, 'Ghi nhận mất/hư hỏng thành công');
  } catch (e) { next(e); }
}

// Danh sách tất cả phiếu mượn (staff)
async function listLoans(req, res, next) {
  try {
    const { search, trangThai, page = 1, limit = 20 } = req.query;
    const { rows, total } = await svc.listLoans({ search, trangThai, page: parseInt(page), limit: parseInt(limit) });
    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) { next(e); }
}

// Xem lịch sử mượn của bạn đọc
async function getLoansByMember(req, res, next) {
  try {
    const banDocId = req.user.userType === 'member' ? req.user.id : req.params.banDocId;
    const loans = await svc.getLoansByMember(banDocId, req.query.trangThai);
    ok(res, loans);
  } catch (e) { next(e); }
}

// Xem chi tiết phiếu mượn
async function getLoanDetail(req, res, next) {
  try {
    const loan = await svc.getLoanDetail(req.params.id);
    ok(res, loan);
  } catch (e) { next(e); }
}

// Xem danh sách đặt trước của bạn đọc
async function getMyReservations(req, res, next) {
  try {
    const banDocId = req.user.userType === 'member' ? req.user.id : req.params.banDocId;
    const reservations = await svc.getReservationsByMember(banDocId);
    ok(res, reservations);
  } catch (e) { next(e); }
}

// D1 - Thu tiền phạt
async function payFine(req, res, next) {
  try {
    const result = await svc.payFine(req.params.id, req.user.id);
    ok(res, result, 'Thu phạt thành công');
  } catch (e) { next(e); }
}

// D1-Exc1 - Miễn giảm phạt (soTienMienGiam tùy chọn; không truyền → miễn 100%)
async function waiveFine(req, res, next) {
  try {
    const { lyDo } = req.body;
    let { soTienMienGiam } = req.body;
    if (!soTienMienGiam) {
      // Lấy số tiền thực tế để miễn 100%
      const fine = await require('../models').PhieuPhat.findByPk(req.params.id);
      if (fine) soTienMienGiam = parseFloat(fine.so_tien);
    }
    const result = await svc.waiveFine(req.params.id, soTienMienGiam, lyDo, req.user.id);
    ok(res, result, 'Miễn giảm phạt thành công');
  } catch (e) { next(e); }
}

module.exports = {
  searchBooks, getBookDetail,
  createReservation, cancelReservation,
  checkoutBook, returnBook, renewLoan,
  reportLostDamaged,
  listLoans, getLoansByMember, getLoanDetail,
  getMyReservations,
  payFine, waiveFine,
};
