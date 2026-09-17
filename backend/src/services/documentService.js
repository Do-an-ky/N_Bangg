'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundError, BusinessRuleError } = require('../utils/errors');
const { ERROR_CODES } = require('../utils/errors');
const { genBookCode, genCopyCode, genOrderCode, genInventoryCode } = require('../utils/codeGenerator');
const { writeAuditLog } = require('../utils/auditLog');

// ─── A1: BỔ SUNG TÀI LIỆU ────────────────────────────────────────────────────
async function createDocument(data, nhanVienId, ip) {
  const count = await db.TaiLieu.count();
  const maTaiLieu = genBookCode(count + 1);

  const doc = await db.TaiLieu.create({
    ma_tai_lieu: maTaiLieu,
    nhan_de: data.nhanDe,
    tac_gia: data.tacGia || null,
    nha_xuat_ban: data.nhaXuatBan || null,
    nam_xuat_ban: data.namXuatBan || null,
    isbn: data.isbn || null,
    loai_tai_lieu: data.loaiTaiLieu || 'sach',
    the_loai: data.theLoai || null,
    mo_ta: data.moTa || null,
    tu_khoa: data.tuKhoa || null,
    bia_sach_url: data.biaSachUrl || null,
    trang_thai: 'cho_bien_muc',
    nha_cung_cap_id: data.nhaCungCapId || null,
  });

  await writeAuditLog(db, {
    loaiDoiTuong: 'tai_lieu', doiTuongId: doc.id, hanhDong: 'tao_moi',
    duLieuSau: { maTaiLieu, nhanDe: data.nhanDe }, nhanVienId, diaChi: ip,
  });

  return doc;
}

// A2: Biên mục tài liệu → 'hoat_dong'
async function catalogDocument(taiLieuId, data, nhanVienId, ip) {
  const doc = await db.TaiLieu.findByPk(taiLieuId);
  if (!doc) throw new NotFoundError('Tài liệu');

  if (!['cho_bien_muc', 'cho_bo_sung_thong_tin'].includes(doc.trang_thai))
    throw new BusinessRuleError('Tài liệu này không cần biên mục (đã ở trạng thái hoạt động)');

  const before = doc.toJSON();
  await doc.update({
    nhan_de: data.nhanDe ?? doc.nhan_de,
    tac_gia: data.tacGia ?? doc.tac_gia,
    nha_xuat_ban: data.nhaXuatBan ?? doc.nha_xuat_ban,
    nam_xuat_ban: data.namXuatBan ?? doc.nam_xuat_ban,
    isbn: data.isbn ?? doc.isbn,
    loai_tai_lieu: data.loaiTaiLieu ?? doc.loai_tai_lieu,
    the_loai: data.theLoai ?? doc.the_loai,
    mo_ta: data.moTa ?? doc.mo_ta,
    tu_khoa: data.tuKhoa ?? doc.tu_khoa,
    bia_sach_url: data.biaSachUrl ?? doc.bia_sach_url,
    trang_thai: 'hoat_dong',
  });

  await writeAuditLog(db, {
    loaiDoiTuong: 'tai_lieu', doiTuongId: taiLieuId, hanhDong: 'bien_muc',
    duLieuTruoc: before, duLieuSau: doc.toJSON(), nhanVienId, diaChi: ip,
  });

  return doc;
}

// A3: Cập nhật thông tin tài liệu (audit log - A3 Rule #9)
async function updateDocument(taiLieuId, data, nhanVienId, ip) {
  const doc = await db.TaiLieu.findByPk(taiLieuId);
  if (!doc) throw new NotFoundError('Tài liệu');
  if (doc.trang_thai === 'ngung_luu_thong')
    throw new BusinessRuleError('Không thể cập nhật tài liệu đã ngừng lưu thông');

  const before = doc.toJSON();
  const allowed = ['nhan_de', 'tac_gia', 'nha_xuat_ban', 'nam_xuat_ban', 'isbn',
    'the_loai', 'mo_ta', 'tu_khoa', 'bia_sach_url', 'nha_cung_cap_id'];
  const updateData = {};
  allowed.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

  await doc.update(updateData);

  await writeAuditLog(db, {
    loaiDoiTuong: 'tai_lieu', doiTuongId: taiLieuId, hanhDong: 'cap_nhat',
    duLieuTruoc: before, duLieuSau: updateData, nhanVienId, diaChi: ip,
  });

  return doc;
}

// A4: Thanh lý bản sao
async function discardCopy(banSaoId, lyDo, nhanVienId, ip) {
  const copy = await db.BanSao.findByPk(banSaoId);
  if (!copy) throw new NotFoundError('Bản sao');

  // A4-Exc1
  if (['dang_muon', 'dat_truoc'].includes(copy.trang_thai))
    throw new BusinessRuleError(ERROR_CODES.COPY_ON_LOAN, 'COPY_ON_LOAN');

  const before = { trangThai: copy.trang_thai };
  await copy.update({ trang_thai: 'da_thanh_ly', ghi_chu: `[Thanh lý] ${lyDo}` });

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_sao', doiTuongId: banSaoId, hanhDong: 'thanh_ly',
    duLieuTruoc: before, duLieuSau: { trangThai: 'da_thanh_ly', lyDo }, nhanVienId, diaChi: ip,
  });

  return copy;
}

// A4-Alt1: Ngừng lưu thông toàn bộ tài liệu
async function stopCirculation(taiLieuId, nhanVienId, ip) {
  const doc = await db.TaiLieu.findByPk(taiLieuId);
  if (!doc) throw new NotFoundError('Tài liệu');

  const activeLoans = await db.PhieuMuon.count({
    include: [{
      model: db.BanSao, as: 'banSao',
      where: { tai_lieu_id: taiLieuId }, required: true,
    }],
    where: { trang_thai: 'dang_muon' },
  });
  if (activeLoans > 0)
    throw new BusinessRuleError('Không thể ngừng lưu thông: còn bản sao đang được mượn');

  await doc.update({ trang_thai: 'ngung_luu_thong' });
  return doc;
}

// Thêm bản sao
async function addCopies(taiLieuId, copies, nhanVienId, ip) {
  const doc = await db.TaiLieu.findByPk(taiLieuId);
  if (!doc) throw new NotFoundError('Tài liệu');

  const count = await db.BanSao.count({ where: { tai_lieu_id: taiLieuId } });
  const created = [];

  for (let i = 0; i < copies.length; i++) {
    const copy = await db.BanSao.create({
      ma_ban_sao: genCopyCode(count + i + 1),
      tai_lieu_id: taiLieuId,
      vi_tri_ke: copies[i].viTriKe || null,
      gia_tri: copies[i].giaTri || 0,
      ghi_chu: copies[i].ghiChu || null,
      trang_thai: doc.trang_thai === 'hoat_dong' ? 'san_sang' : 'cho_bien_muc',
    });
    created.push(copy);
  }

  await writeAuditLog(db, {
    loaiDoiTuong: 'ban_sao', doiTuongId: taiLieuId, hanhDong: 'tao_moi',
    duLieuSau: { soBanSaoThem: copies.length }, nhanVienId, diaChi: ip,
  });

  return created;
}

// Danh sách tài liệu (quản trị — tất cả trạng thái)
async function listDocuments({ q, loaiTaiLieu, trangThai, nhaCungCapId, page = 1, limit = 20 }) {
  const where = {};
  if (trangThai) where.trang_thai = trangThai;
  if (loaiTaiLieu) where.loai_tai_lieu = loaiTaiLieu;
  if (nhaCungCapId) where.nha_cung_cap_id = nhaCungCapId;
  if (q) {
    where[Op.or] = [
      { nhan_de: { [Op.iLike]: `%${q}%` } },
      { tac_gia: { [Op.iLike]: `%${q}%` } },
      { isbn: { [Op.iLike]: `%${q}%` } },
      { ma_tai_lieu: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return db.TaiLieu.findAndCountAll({
    where,
    include: [{
      model: db.BanSao, as: 'banSao',
      attributes: ['id', 'ma_ban_sao', 'trang_thai'],
      where: { trang_thai: { [Op.ne]: 'da_thanh_ly' } },
      required: false,
    }],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    distinct: true,
  });
}

async function getDocumentById(id) {
  const doc = await db.TaiLieu.findByPk(id, {
    include: [
      { model: db.BanSao, as: 'banSao' },
      { model: db.NhaCungCap, as: 'nhaCungCap', required: false },
    ],
  });
  if (!doc) throw new NotFoundError('Tài liệu');
  return doc;
}

async function getCopiesByDocument(taiLieuId) {
  return db.BanSao.findAll({
    where: { tai_lieu_id: taiLieuId },
    order: [['ma_ban_sao', 'ASC']],
  });
}

// ─── A5: NHÀ CUNG CẤP ────────────────────────────────────────────────────────
async function listSuppliers({ q, page = 1, limit = 20 }) {
  const where = {};
  if (q) where.ten = { [Op.iLike]: `%${q}%` };
  return db.NhaCungCap.findAndCountAll({
    where, order: [['ten', 'ASC']],
    limit: Number(limit), offset: (Number(page) - 1) * Number(limit),
  });
}

async function createSupplier(data) {
  return db.NhaCungCap.create({
    ma_nha_cung_cap: `NCC${Date.now()}`.slice(0, 20),
    ten: data.tenNhaCungCap,
    dia_chi: data.diaChi || null,
    so_dien_thoai: data.soDienThoai || null,
    email: data.email || null,
    ghi_chu: data.nguoiLienHe ? `Liên hệ: ${data.nguoiLienHe}` : null,
  });
}

async function updateSupplier(id, data) {
  const s = await db.NhaCungCap.findByPk(id);
  if (!s) throw new NotFoundError('Nhà cung cấp');
  await s.update({
    ten: data.tenNhaCungCap ?? s.ten,
    dia_chi: data.diaChi ?? s.dia_chi,
    so_dien_thoai: data.soDienThoai ?? s.so_dien_thoai,
    email: data.email ?? s.email,
  });
  return s;
}

// ─── A5: ĐƠN ĐẶT HÀNG ────────────────────────────────────────────────────────
async function createOrder(data, nhanVienId, ip) {
  if (!data.items || data.items.length === 0)
    throw new BusinessRuleError('Đơn đặt hàng phải có ít nhất 1 tài liệu');

  const t = await db.sequelize.transaction();
  try {
    const order = await db.DonDatHang.create({
      ma_don: genOrderCode(),
      nha_cung_cap_id: data.nhaCungCapId,
      nhan_vien_id: nhanVienId,
      ngay_lap: new Date().toISOString().split('T')[0],
      ghi_chu: data.ghiChu || null,
      trang_thai: 'cho_duyet',
    }, { transaction: t });

    for (const item of data.items) {
      await db.ChiTietDonDatHang.create({
        don_dat_hang_id: order.id,
        tai_lieu_id: item.taiLieuId || null,
        nhan_de_du_kien: item.tenTaiLieu,
        so_luong_dat: item.soLuong,
        don_gia_du_kien: item.donGia,
      }, { transaction: t });
    }

    await t.commit();
    return order;
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function approveOrder(orderId, nhanVienId) {
  const order = await db.DonDatHang.findByPk(orderId);
  if (!order) throw new NotFoundError('Đơn đặt hàng');
  if (order.trang_thai !== 'cho_duyet')
    throw new BusinessRuleError('Chỉ có thể duyệt đơn hàng ở trạng thái chờ duyệt');

  await order.update({ trang_thai: 'da_duyet', nguoi_duyet_id: nhanVienId, ngay_duyet: new Date() });
  return order;
}

// Nhập hàng → tạo bản sao từ items đã có tai_lieu_id
async function receiveOrder(orderId, nhanVienId, ip) {
  const order = await db.DonDatHang.findByPk(orderId, {
    include: [{ model: db.ChiTietDonDatHang, as: 'chiTiet' }],
  });
  if (!order) throw new NotFoundError('Đơn đặt hàng');
  if (order.trang_thai !== 'da_duyet')
    throw new BusinessRuleError('Chỉ có thể nhập hàng cho đơn đã được duyệt');

  const t = await db.sequelize.transaction();
  try {
    const createdCopies = [];
    for (const item of order.chiTiet) {
      if (!item.tai_lieu_id) continue;
      const count = await db.BanSao.count({ where: { tai_lieu_id: item.tai_lieu_id }, transaction: t });
      const doc = await db.TaiLieu.findByPk(item.tai_lieu_id, { transaction: t });
      const soLuong = item.so_luong_dat - (item.so_luong_da_nhan || 0);

      for (let i = 0; i < soLuong; i++) {
        const copy = await db.BanSao.create({
          ma_ban_sao: genCopyCode(count + i + 1),
          tai_lieu_id: item.tai_lieu_id,
          gia_tri: parseFloat(item.don_gia_du_kien) || 0,
          ghi_chu: `Nhập theo đơn ${order.ma_don}`,
          trang_thai: doc?.trang_thai === 'hoat_dong' ? 'san_sang' : 'cho_bien_muc',
        }, { transaction: t });
        createdCopies.push(copy);
      }

      await item.update({ so_luong_da_nhan: item.so_luong_dat }, { transaction: t });
    }

    await order.update({ trang_thai: 'hoan_thanh' }, { transaction: t });

    await writeAuditLog(db, {
      loaiDoiTuong: 'don_dat_hang', doiTuongId: orderId, hanhDong: 'tao_moi',
      duLieuSau: { soBanSaoTao: createdCopies.length }, nhanVienId, diaChi: ip,
    });

    await t.commit();
    return { order, createdCopies };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function cancelOrder(orderId, lyDo, nhanVienId) {
  const order = await db.DonDatHang.findByPk(orderId);
  if (!order) throw new NotFoundError('Đơn đặt hàng');
  if (!['cho_duyet', 'da_duyet'].includes(order.trang_thai))
    throw new BusinessRuleError('Không thể hủy đơn hàng ở trạng thái này');

  await order.update({ trang_thai: 'da_huy', ghi_chu: lyDo });
  return order;
}

async function listOrders({ trangThai, nhaCungCapId, page = 1, limit = 20 }) {
  const where = {};
  if (trangThai) where.trang_thai = trangThai;
  if (nhaCungCapId) where.nha_cung_cap_id = nhaCungCapId;

  return db.DonDatHang.findAndCountAll({
    where,
    include: [
      { model: db.NhaCungCap, as: 'nhaCungCap', attributes: ['id', 'ten'] },
      { model: db.ChiTietDonDatHang, as: 'chiTiet' },
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    distinct: true,
  });
}

// ─── KIỂM KÊ ─────────────────────────────────────────────────────────────────
async function startInventory(ghiChu, nhanVienId) {
  const active = await db.KiemKe.findOne({ where: { trang_thai: 'dang_kiem_ke' } });
  if (active) throw new BusinessRuleError('Đang có phiên kiểm kê diễn ra. Hoàn thành trước khi tạo mới');

  return db.KiemKe.create({
    ma_kiem_ke: genInventoryCode(),
    nhan_vien_id: nhanVienId,
    ngay_bat_dau: new Date().toISOString().split('T')[0],
    ghi_chu: ghiChu || null,
    trang_thai: 'dang_kiem_ke',
  });
}

async function recordInventoryItem(kiemKeId, maBanSao, tinhTrang, ghiChu) {
  const session = await db.KiemKe.findByPk(kiemKeId);
  if (!session || session.trang_thai !== 'dang_kiem_ke')
    throw new NotFoundError('Phiên kiểm kê đang hoạt động');

  const copy = await db.BanSao.findOne({ where: { ma_ban_sao: maBanSao } });
  if (!copy) throw new NotFoundError('Bản sao');

  // tinhTrang đã khớp với ENUM: 'co_mat' | 'thieu' | 'sai_vi_tri' | 'hu_hong'
  const trangThaiThucTe = tinhTrang;

  const [item, created] = await db.ChiTietKiemKe.findOrCreate({
    where: { kiem_ke_id: kiemKeId, ban_sao_id: copy.id },
    defaults: {
      trang_thai_he_thong: copy.trang_thai,
      trang_thai_thuc_te: trangThaiThucTe,
      ghi_chu: ghiChu || null,
    },
  });

  if (!created) {
    await item.update({ trang_thai_thuc_te: trangThaiThucTe, ghi_chu: ghiChu || null });
  }

  return item;
}

async function finishInventory(kiemKeId, nhanVienId) {
  const session = await db.KiemKe.findByPk(kiemKeId);
  if (!session || session.trang_thai !== 'dang_kiem_ke')
    throw new NotFoundError('Phiên kiểm kê đang hoạt động');

  await session.update({ trang_thai: 'hoan_thanh', ngay_ket_thuc: new Date().toISOString().split('T')[0] });
  return session;
}

async function getInventoryById(kiemKeId) {
  const session = await db.KiemKe.findByPk(kiemKeId, {
    include: [{
      model: db.ChiTietKiemKe, as: 'chiTiet',
      include: [{
        model: db.BanSao, as: 'banSao',
        include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de', 'ma_tai_lieu'] }],
      }],
    }],
  });
  if (!session) throw new NotFoundError('Phiên kiểm kê');
  return session;
}

async function listInventorySessions({ page = 1, limit = 20 }) {
  return db.KiemKe.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });
}

module.exports = {
  createDocument, catalogDocument, updateDocument, discardCopy, stopCirculation,
  addCopies, listDocuments, getDocumentById, getCopiesByDocument,
  listSuppliers, createSupplier, updateSupplier,
  createOrder, approveOrder, receiveOrder, cancelOrder, listOrders,
  startInventory, recordInventoryItem, finishInventory, getInventoryById, listInventorySessions,
};
