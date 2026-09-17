'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundError, BusinessRuleError, ValidationError } = require('../utils/errors');
const { ERROR_CODES } = require('../utils/errors');
const { genMemberCode } = require('../utils/codeGenerator');
const { writeAuditLog } = require('../utils/auditLog');

// B1 - Đăng ký thẻ thư viện
async function registerMember(data, nhanVienId, ip) {
  // B1-Exc1: kiểm tra trùng CMND/mã sinh viên
  if (data.soCmnd) {
    const existing = await db.BanDoc.findOne({ where: { so_cmnd: data.soCmnd } });
    if (existing) throw new BusinessRuleError(ERROR_CODES.MEMBER_DUPLICATE, 'MEMBER_DUPLICATE');
  }
  if (data.maSinhVien) {
    const existing = await db.BanDoc.findOne({ where: { ma_sinh_vien: data.maSinhVien } });
    if (existing) throw new BusinessRuleError(ERROR_CODES.MEMBER_DUPLICATE, 'MEMBER_DUPLICATE');
  }

  // Tạo mã thẻ tự tăng
  const count = await db.BanDoc.count();
  const maThe = genMemberCode(count + 1);

  // Tính ngày hết hạn theo hạng mục (1 năm cho SV, 3 năm cho GV)
  const today = new Date();
  const expYears = data.hangMuc === 'giang_vien' ? 3 : 1;
  const ngayHetHan = new Date(today);
  ngayHetHan.setFullYear(ngayHetHan.getFullYear() + expYears);

  let passwordHash = null;
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(data.password, salt);
  }

  const member = await db.BanDoc.create({
    ma_the: maThe,
    ho_ten: data.hoTen,
    ngay_sinh: data.ngaySinh || null,
    email: data.email || null,
    so_dien_thoai: data.soDienThoai || null,
    dia_chi: data.diaChi || null,
    so_cmnd: data.soCmnd || null,
    ma_sinh_vien: data.maSinhVien || null,
    don_vi: data.donVi || null,
    hang_muc: data.hangMuc || 'sinh_vien',
    trang_thai_the: 'hoat_dong',
    ngay_dang_ky: today.toISOString().split('T')[0],
    ngay_het_han: ngayHetHan.toISOString().split('T')[0],
    password_hash: passwordHash,
  });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: member.id,
    hanhDong: 'tao_moi', duLieuSau: { maThe, hoTen: data.hoTen },
    nhanVienId, diaChi: ip,
  });

  return member;
}

// B2 - Gia hạn thẻ thư viện
async function renewMemberCard(banDocId, nhanVienId, ip) {
  const member = await getMemberById(banDocId);

  // B2-Exc1: còn công nợ hoặc tài liệu quá hạn
  const debt = await getTotalDebt(banDocId);
  if (debt > 0) throw new BusinessRuleError(ERROR_CODES.RENEW_CARD_HAS_DEBT, 'RENEW_CARD_HAS_DEBT');

  const overdueLoans = await db.PhieuMuon.count({
    where: {
      ban_doc_id: banDocId,
      trang_thai: 'dang_muon',
      ngay_hen_tra: { [Op.lt]: new Date().toISOString().split('T')[0] },
    },
  });
  if (overdueLoans > 0) throw new BusinessRuleError(ERROR_CODES.RENEW_CARD_HAS_OVERDUE, 'RENEW_CARD_HAS_OVERDUE');

  const oldExpiry = new Date(member.ngay_het_han);
  const base = oldExpiry > new Date() ? oldExpiry : new Date();
  const expYears = member.hang_muc === 'giang_vien' ? 3 : 1;
  base.setFullYear(base.getFullYear() + expYears);
  const newExpiry = base.toISOString().split('T')[0];

  const before = { ngayHetHan: member.ngay_het_han, trangThai: member.trang_thai_the };
  await member.update({ ngay_het_han: newExpiry, trang_thai_the: 'hoat_dong' });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: banDocId, hanhDong: 'cap_nhat',
    duLieuTruoc: before, duLieuSau: { ngayHetHan: newExpiry }, nhanVienId, diaChi: ip,
  });

  return member;
}

// B3 - Cập nhật thông tin bạn đọc
async function updateMember(banDocId, data, nhanVienId, ip) {
  const member = await getMemberById(banDocId);
  const before = member.toJSON();

  const allowedFields = ['ho_ten', 'ngay_sinh', 'email', 'so_dien_thoai', 'dia_chi', 'don_vi'];
  const updateData = {};
  allowedFields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

  await member.update(updateData);

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: banDocId, hanhDong: 'cap_nhat',
    duLieuTruoc: before, duLieuSau: updateData, nhanVienId, diaChi: ip,
  });

  return member;
}

// B3-Alt1 - Khóa thẻ
async function lockMemberCard(banDocId, lyDo, nhanVienId, ip) {
  const member = await getMemberById(banDocId);
  const before = { trangThaiThe: member.trang_thai_the };
  await member.update({ trang_thai_the: 'bi_khoa', ly_do_khoa: lyDo });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: banDocId, hanhDong: 'khoa',
    duLieuTruoc: before, duLieuSau: { trangThaiThe: 'bi_khoa', lyDoKhoa: lyDo }, nhanVienId, diaChi: ip,
  });
  return member;
}

// B3 - Mở khóa thẻ
async function unlockMemberCard(banDocId, nhanVienId, ip) {
  const member = await getMemberById(banDocId);
  await member.update({ trang_thai_the: 'hoat_dong', ly_do_khoa: null });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: banDocId, hanhDong: 'mo_khoa',
    nhanVienId, diaChi: ip,
  });
  return member;
}

// B4 - Hủy thẻ
async function cancelMemberCard(banDocId, nhanVienId, ip) {
  const member = await getMemberById(banDocId);

  // B4-Exc1: còn sách đang mượn hoặc công nợ
  const activeLoans = await db.PhieuMuon.count({ where: { ban_doc_id: banDocId, trang_thai: 'dang_muon' } });
  if (activeLoans > 0) throw new BusinessRuleError(ERROR_CODES.CANCEL_CARD_HAS_LOAN, 'CANCEL_CARD_HAS_LOAN');

  const debt = await getTotalDebt(banDocId);
  if (debt > 0) throw new BusinessRuleError(ERROR_CODES.CANCEL_CARD_HAS_DEBT, 'CANCEL_CARD_HAS_DEBT');

  await member.update({ trang_thai_the: 'da_huy' });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_doc', doiTuongId: banDocId, hanhDong: 'xoa',
    duLieuSau: { trangThaiThe: 'da_huy' }, nhanVienId, diaChi: ip,
  });
  return member;
}

// Lấy hồ sơ bạn đọc kèm thống kê
async function getMemberById(id) {
  const member = await db.BanDoc.findByPk(id);
  if (!member) throw new NotFoundError('Bạn đọc');
  return member;
}

// D3: Tổng công nợ chưa thanh toán
async function getTotalDebt(banDocId) {
  const result = await db.PhieuPhat.sum('so_tien', {
    where: { ban_doc_id: banDocId, trang_thai_thanh_toan: 'chua_thanh_toan' },
  });
  return result || 0;
}

// Danh sách phiếu phạt chưa thanh toán
async function getMemberDebt(banDocId) {
  await getMemberById(banDocId);
  const fines = await db.PhieuPhat.findAll({
    where: { ban_doc_id: banDocId, trang_thai_thanh_toan: 'chua_thanh_toan' },
    include: [{ model: db.PhieuMuon, as: 'phieuMuon', include: [{ model: db.BanSao, as: 'banSao', include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de'] }] }] }],
    order: [['created_at', 'DESC']],
  });
  const total = fines.reduce((s, f) => s + parseFloat(f.so_tien), 0);
  return { total, fines };
}

// Danh sách bạn đọc (phân trang, tìm kiếm)
async function listMembers({ search, hangMuc, trangThai, page = 1, limit = 20 }) {
  const where = {};
  if (search) where[Op.or] = [
    { ho_ten: { [Op.iLike]: `%${search}%` } },
    { ma_the: { [Op.iLike]: `%${search}%` } },
    { so_cmnd: { [Op.iLike]: `%${search}%` } },
    { ma_sinh_vien: { [Op.iLike]: `%${search}%` } },
  ];
  if (hangMuc) where.hang_muc = hangMuc;
  if (trangThai) where.trang_thai_the = trangThai;

  const { count, rows } = await db.BanDoc.findAndCountAll({
    where,
    order: [['ho_ten', 'ASC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    attributes: { exclude: ['password_hash'] },
  });
  return { count, rows };
}

module.exports = {
  registerMember, renewMemberCard, updateMember,
  lockMemberCard, unlockMemberCard, cancelMemberCard,
  getMemberById, getTotalDebt, getMemberDebt, listMembers,
};
