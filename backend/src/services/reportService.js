'use strict';
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');

// F1: Thống kê mượn / trả theo khoảng thời gian
async function getLoanStats(dateFrom, dateTo) {
  const where = {};
  if (dateFrom) where.ngay_muon = { [Op.gte]: dateFrom };
  if (dateTo) where.ngay_muon = { ...where.ngay_muon, [Op.lte]: dateTo };

  // Tổng phiếu mượn theo trạng thái
  const byStatus = await db.PhieuMuon.findAll({
    where,
    attributes: ['trang_thai', [fn('COUNT', col('id')), 'so_luong']],
    group: ['trang_thai'],
    raw: true,
  });

  // Tổng mượn mới trong kỳ
  const tongMuon = await db.PhieuMuon.count({ where });

  // Tổng trả trong kỳ
  const tongTra = await db.PhieuMuon.count({
    where: {
      ...where,
      trang_thai: { [Op.in]: ['da_tra_dung_han', 'da_tra_tre_han'] },
    },
  });

  // Tổng trả trễ trong kỳ
  const tongTraTre = await db.PhieuMuon.count({
    where: { ...where, trang_thai: 'da_tra_tre_han' },
  });

  // Tổng tiền phạt trong kỳ
  const tongPhat = await db.PhieuPhat.sum('so_tien', {
    where: dateFrom || dateTo ? {
      created_at: {
        ...(dateFrom && { [Op.gte]: dateFrom }),
        ...(dateTo && { [Op.lte]: dateTo }),
      },
    } : {},
  });

  // Top 10 tài liệu được mượn nhiều nhất
  const topDocuments = await db.PhieuMuon.findAll({
    where,
    include: [{
      model: db.BanSao, as: 'banSao',
      include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['id', 'ma_tai_lieu', 'nhan_de', 'tac_gia'] }],
    }],
    attributes: ['ban_sao_id', [fn('COUNT', col('PhieuMuon.id')), 'soLuotMuon']],
    group: ['ban_sao_id', 'banSao.id', 'banSao->taiLieu.id'],
    order: [[literal('"soLuotMuon"'), 'DESC']],
    limit: 10,
    raw: false,
    subQuery: false,
  });

  return {
    tongMuon,
    tongTra,
    tongTraTre,
    tongPhat: tongPhat || 0,
    byStatus,
    topDocuments: topDocuments.map(r => ({
      soLuotMuon: r.getDataValue('soLuotMuon'),
      taiLieu: r.banSao?.taiLieu,
    })),
  };
}

// F2: Thống kê tài liệu / bản sao
async function getDocumentStats() {
  // Tổng tài liệu theo trạng thái
  const docByStatus = await db.TaiLieu.findAll({
    attributes: ['trang_thai', [fn('COUNT', col('id')), 'so_luong']],
    group: ['trang_thai'],
    raw: true,
  });

  // Tổng bản sao theo trạng thái
  const copyByStatus = await db.BanSao.findAll({
    attributes: ['trang_thai', [fn('COUNT', col('id')), 'so_luong']],
    group: ['trang_thai'],
    raw: true,
  });

  // Tổng tài liệu theo loại
  const docByType = await db.TaiLieu.findAll({
    attributes: ['loai_tai_lieu', [fn('COUNT', col('id')), 'so_luong']],
    group: ['loai_tai_lieu'],
    raw: true,
  });

  const tongTaiLieu = await db.TaiLieu.count();
  const tongBanSao = await db.BanSao.count({ where: { trang_thai: { [Op.ne]: 'da_thanh_ly' } } });
  const banSaoSanSang = await db.BanSao.count({ where: { trang_thai: 'san_sang' } });
  const banSaoDangMuon = await db.BanSao.count({ where: { trang_thai: 'dang_muon' } });

  return { tongTaiLieu, tongBanSao, banSaoSanSang, banSaoDangMuon, docByStatus, docByType, copyByStatus };
}

// F3: Thống kê bạn đọc
async function getMemberStats() {
  // Tổng bạn đọc theo hạng mục
  const byCategory = await db.BanDoc.findAll({
    attributes: ['hang_muc', [fn('COUNT', col('id')), 'so_luong']],
    group: ['hang_muc'],
    raw: true,
  });

  // Tổng bạn đọc theo trạng thái thẻ
  const byStatus = await db.BanDoc.findAll({
    attributes: ['trang_thai_the', [fn('COUNT', col('id')), 'so_luong']],
    group: ['trang_thai_the'],
    raw: true,
  });

  const tongBanDoc = await db.BanDoc.count();

  // Thẻ sắp hết hạn trong 30 ngày tới
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const sapHetHan = await db.BanDoc.count({
    where: {
      trang_thai_the: 'hoat_dong',
      ngay_het_han: { [Op.between]: [new Date(), thirtyDaysLater] },
    },
  });

  // Bạn đọc đang có sách quá hạn
  const today = new Date().toISOString().split('T')[0];
  const coSachQuaHan = await db.PhieuMuon.count({
    where: { trang_thai: 'dang_muon', ngay_hen_tra: { [Op.lt]: today } },
    distinct: true,
    col: 'ban_doc_id',
  });

  // Đăng ký mới trong 30 ngày
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dangKyMoi = await db.BanDoc.count({
    where: { ngay_dang_ky: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] } },
  });

  return { tongBanDoc, sapHetHan, coSachQuaHan, dangKyMoi, byCategory, byStatus };
}

// F4: Báo cáo công nợ / phiếu phạt
async function getFineStats({ trangThai, search, dateFrom, dateTo, page = 1, limit = 20 }) {
  const where = {};
  if (trangThai) where.trang_thai_thanh_toan = trangThai;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = dateFrom;
    if (dateTo) where.created_at[Op.lte] = dateTo;
  }
  if (search) where.ma_phieu_phat = { [Op.iLike]: `%${search}%` };

  const memberWhere = search
    ? { [Op.or]: [{ ho_ten: { [Op.iLike]: `%${search}%` } }, { ma_the: { [Op.iLike]: `%${search}%` } }] }
    : undefined;

  const tongChuaThanhToan = await db.PhieuPhat.sum('so_tien', {
    where: { trang_thai_thanh_toan: 'chua_thanh_toan' },
  });
  const tongDaThanhToan = await db.PhieuPhat.sum('so_tien', {
    where: { trang_thai_thanh_toan: 'da_thanh_toan' },
  });

  const { count, rows } = await db.PhieuPhat.findAndCountAll({
    where,
    include: [
      { model: db.BanDoc, as: 'banDoc', attributes: ['id', 'ma_the', 'ho_ten'], where: memberWhere, required: !!memberWhere },
      {
        model: db.PhieuMuon, as: 'phieuMuon',
        include: [{
          model: db.BanSao, as: 'banSao',
          include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de'] }],
        }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    distinct: true,
  });

  return {
    summary: {
      tongChuaThanhToan: tongChuaThanhToan || 0,
      tongDaThanhToan: tongDaThanhToan || 0,
    },
    count,
    rows,
  };
}

// F4: Báo cáo kiểm kê tồn kho (xem chi tiết)
async function getInventoryReport(kiemKeId) {
  const session = await db.KiemKe.findByPk(kiemKeId, {
    include: [{
      model: db.ChiTietKiemKe, as: 'chiTiet',
      include: [{
        model: db.BanSao, as: 'banSao',
        include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de', 'ma_tai_lieu', 'loai_tai_lieu'] }],
      }],
    }],
  });
  if (!session) return null;

  const items = session.chiTiet || [];
  const summary = {
    tongKiem: items.length,
    binh_thuong: items.filter(i => i.tinh_trang_kiem_ke === 'binh_thuong').length,
    hu_hong: items.filter(i => i.tinh_trang_kiem_ke === 'hu_hong').length,
    mat: items.filter(i => i.tinh_trang_kiem_ke === 'mat').length,
  };

  return { session, summary };
}

// Dashboard tổng quan
async function getDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const [loans, members, docs, overdue, fines] = await Promise.all([
    db.PhieuMuon.count({ where: { trang_thai: 'dang_muon' } }),
    db.BanDoc.count({ where: { trang_thai_the: 'hoat_dong' } }),
    db.TaiLieu.count({ where: { trang_thai: 'hoat_dong' } }),
    db.PhieuMuon.count({ where: { trang_thai: 'dang_muon', ngay_hen_tra: { [Op.lt]: today } } }),
    db.PhieuPhat.sum('so_tien', { where: { trang_thai_thanh_toan: 'chua_thanh_toan' } }),
  ]);

  return {
    dangMuon: loans,
    banDocHoatDong: members,
    taiLieuHoatDong: docs,
    quaHan: overdue,
    tongCongNo: fines || 0,
  };
}

module.exports = { getLoanStats, getDocumentStats, getMemberStats, getFineStats, getInventoryReport, getDashboard };
