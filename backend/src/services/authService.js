'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { AuthError, AppError } = require('../utils/errors');

// E1: Đăng nhập nhân viên (thu_thu / quan_ly / admin)
async function loginStaff(email, password) {
  const nv = await db.NhanVien.findOne({ where: { email } });
  if (!nv) throw new AuthError('Email hoặc mật khẩu không đúng');
  if (nv.trang_thai === 'bi_khoa') throw new AuthError('Tài khoản đã bị khóa. Liên hệ quản trị viên');

  const valid = await bcrypt.compare(password, nv.password_hash);
  if (!valid) throw new AuthError('Email hoặc mật khẩu không đúng');

  const payload = { id: nv.id, role: nv.vai_tro, userType: 'staff', hoTen: nv.ho_ten };
  const token = signToken(payload);
  return { token, user: { id: nv.id, hoTen: nv.ho_ten, email: nv.email, vaiTro: nv.vai_tro } };
}

// E1: Đăng nhập bạn đọc qua OPAC (mã thẻ + password)
async function loginMember(maThe, password) {
  const bd = await db.BanDoc.findOne({ where: { ma_the: maThe } });
  if (!bd) throw new AuthError('Mã thẻ hoặc mật khẩu không đúng');
  if (bd.trang_thai_the === 'da_huy') throw new AuthError('Thẻ đã bị hủy. Liên hệ thư viện để được hỗ trợ');
  if (!bd.password_hash) throw new AuthError('Tài khoản chưa được kích hoạt. Liên hệ thủ thư để đặt mật khẩu');

  const valid = await bcrypt.compare(password, bd.password_hash);
  if (!valid) throw new AuthError('Mã thẻ hoặc mật khẩu không đúng');

  const payload = { id: bd.id, role: 'ban_doc', userType: 'member', hoTen: bd.ho_ten };
  const token = signToken(payload);
  return {
    token,
    user: { id: bd.id, hoTen: bd.ho_ten, maThe: bd.ma_the, hangMuc: bd.hang_muc, trangThaiThe: bd.trang_thai_the },
  };
}

// Kích hoạt mật khẩu lần đầu cho bạn đọc (thủ thư thực hiện)
async function setMemberPassword(banDocId, newPassword) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  await db.BanDoc.update({ password_hash: hash }, { where: { id: banDocId } });
}

// E2: Đổi mật khẩu cho nhân viên
async function changeStaffPassword(nhanVienId, matKhauCu, matKhauMoi) {
  const nv = await db.NhanVien.findByPk(nhanVienId);
  if (!nv) throw new AppError('Tài khoản không tồn tại', 404);

  const valid = await bcrypt.compare(matKhauCu, nv.password_hash);
  if (!valid) throw new AuthError('Mật khẩu hiện tại không đúng');

  if (matKhauMoi.length < 6) throw new AppError('Mật khẩu mới phải ít nhất 6 ký tự', 400);

  const salt = await bcrypt.genSalt(10);
  await nv.update({ password_hash: await bcrypt.hash(matKhauMoi, salt) });
}

// E2: Đổi mật khẩu cho bạn đọc (self-service qua OPAC)
async function changeMemberPassword(banDocId, matKhauCu, matKhauMoi) {
  const bd = await db.BanDoc.findByPk(banDocId);
  if (!bd) throw new AppError('Tài khoản không tồn tại', 404);

  if (!bd.password_hash) throw new AppError('Tài khoản chưa được kích hoạt', 400);

  const valid = await bcrypt.compare(matKhauCu, bd.password_hash);
  if (!valid) throw new AuthError('Mật khẩu hiện tại không đúng');

  if (matKhauMoi.length < 6) throw new AppError('Mật khẩu mới phải ít nhất 6 ký tự', 400);

  const salt = await bcrypt.genSalt(10);
  await bd.update({ password_hash: await bcrypt.hash(matKhauMoi, salt) });
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

module.exports = { loginStaff, loginMember, setMemberPassword, changeStaffPassword, changeMemberPassword };
