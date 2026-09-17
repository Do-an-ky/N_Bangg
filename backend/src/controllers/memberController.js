'use strict';
const svc = require('../services/memberService');
const { ok, created, paginated } = require('../utils/response');

// B1 - Đăng ký thẻ thư viện
async function register(req, res, next) {
  try {
    const member = await svc.registerMember(req.body, req.user?.id, req.ip);
    created(res, member, 'Đăng ký thẻ thành công');
  } catch (e) { next(e); }
}

// Danh sách bạn đọc
async function list(req, res, next) {
  try {
    const { search, hangMuc, trangThai, page, limit } = req.query;
    const result = await svc.listMembers({ search, hangMuc, trangThai, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

// Lấy thông tin bạn đọc
async function getById(req, res, next) {
  try {
    const member = await svc.getMemberById(req.params.id);
    ok(res, member);
  } catch (e) { next(e); }
}

// B3 - Cập nhật thông tin
async function update(req, res, next) {
  try {
    const member = await svc.updateMember(req.params.id, req.body, req.user?.id, req.ip);
    ok(res, member, 'Cập nhật thông tin thành công');
  } catch (e) { next(e); }
}

// B2 - Gia hạn thẻ
async function renewCard(req, res, next) {
  try {
    const member = await svc.renewMemberCard(req.params.id, req.user?.id, req.ip);
    ok(res, member, 'Gia hạn thẻ thành công');
  } catch (e) { next(e); }
}

// B3-Alt1 - Khóa thẻ
async function lockCard(req, res, next) {
  try {
    const member = await svc.lockMemberCard(req.params.id, req.body.lyDo, req.user?.id, req.ip);
    ok(res, member, 'Khóa thẻ thành công');
  } catch (e) { next(e); }
}

// B3 - Mở khóa thẻ
async function unlockCard(req, res, next) {
  try {
    const member = await svc.unlockMemberCard(req.params.id, req.user?.id, req.ip);
    ok(res, member, 'Mở khóa thẻ thành công');
  } catch (e) { next(e); }
}

// B4 - Hủy thẻ
async function cancelCard(req, res, next) {
  try {
    const member = await svc.cancelMemberCard(req.params.id, req.user?.id, req.ip);
    ok(res, member, 'Hủy thẻ thành công');
  } catch (e) { next(e); }
}

// D3 - Xem công nợ
async function getDebt(req, res, next) {
  try {
    const result = await svc.getMemberDebt(req.params.id);
    ok(res, result);
  } catch (e) { next(e); }
}

module.exports = { register, list, getById, update, renewCard, lockCard, unlockCard, cancelCard, getDebt };
