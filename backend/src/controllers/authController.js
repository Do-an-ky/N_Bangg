'use strict';
const { loginStaff, loginMember, setMemberPassword, changeStaffPassword, changeMemberPassword } = require('../services/authService');
const { ok } = require('../utils/response');

// E1 - Đăng nhập nhân viên
async function staffLogin(req, res, next) {
  try {
    const { email, matKhau } = req.body;
    const result = await loginStaff(email, matKhau);
    ok(res, result, 'Đăng nhập thành công');
  } catch (e) { next(e); }
}

// E1 - Đăng nhập bạn đọc
async function memberLogin(req, res, next) {
  try {
    const { maThe, matKhau } = req.body;
    const result = await loginMember(maThe, matKhau);
    ok(res, result, 'Đăng nhập thành công');
  } catch (e) { next(e); }
}

// Xem thông tin người dùng hiện tại
async function me(req, res) {
  ok(res, req.user);
}

// Đặt mật khẩu cho bạn đọc (thủ thư thực hiện)
async function setPassword(req, res, next) {
  try {
    const { banDocId } = req.params;
    const { matKhau } = req.body;
    await setMemberPassword(banDocId, matKhau);
    ok(res, null, 'Đặt mật khẩu thành công');
  } catch (e) { next(e); }
}

// E2 - Đổi mật khẩu (nhân viên hoặc bạn đọc tự đổi)
async function changePassword(req, res, next) {
  try {
    const { matKhauCu, matKhauMoi } = req.body;
    if (!matKhauCu || !matKhauMoi) {
      return res.status(400).json({ success: false, error: { message: 'Vui lòng nhập đủ mật khẩu cũ và mới' } });
    }
    if (req.user.userType === 'staff') {
      await changeStaffPassword(req.user.id, matKhauCu, matKhauMoi);
    } else {
      await changeMemberPassword(req.user.id, matKhauCu, matKhauMoi);
    }
    ok(res, null, 'Đổi mật khẩu thành công');
  } catch (e) { next(e); }
}

module.exports = { staffLogin, memberLogin, me, setPassword, changePassword };
