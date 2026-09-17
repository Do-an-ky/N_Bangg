'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const cfg = dbConfig[env];

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, cfg);

// ─── NhanVien ─────────────────────────────────────────────────────────────────
const NhanVien = sequelize.define('NhanVien', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_nhan_vien: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  ho_ten: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  vai_tro: { type: DataTypes.ENUM('thu_thu', 'quan_ly', 'admin'), allowNull: false },
  trang_thai: { type: DataTypes.ENUM('hoat_dong', 'bi_khoa'), defaultValue: 'hoat_dong' },
  so_dien_thoai: { type: DataTypes.STRING(20) },
}, { tableName: 'nhan_vien', underscored: true });

// ─── NhaCungCap ───────────────────────────────────────────────────────────────
const NhaCungCap = sequelize.define('NhaCungCap', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_nha_cung_cap: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  ten: { type: DataTypes.STRING(200), allowNull: false },
  dia_chi: DataTypes.TEXT,
  so_dien_thoai: DataTypes.STRING(20),
  email: DataTypes.STRING(150),
  website: DataTypes.STRING(255),
  ghi_chu: DataTypes.TEXT,
  trang_thai: { type: DataTypes.ENUM('hoat_dong', 'ngung_hop_tac'), defaultValue: 'hoat_dong' },
}, { tableName: 'nha_cung_cap', underscored: true });

// ─── TaiLieu ──────────────────────────────────────────────────────────────────
const TaiLieu = sequelize.define('TaiLieu', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_tai_lieu: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nhan_de: { type: DataTypes.STRING(500), allowNull: false },
  tac_gia: { type: DataTypes.STRING(300), allowNull: false },
  nha_xuat_ban: DataTypes.STRING(200),
  nam_xuat_ban: DataTypes.INTEGER,
  isbn: DataTypes.STRING(20),
  the_loai: DataTypes.STRING(100),
  loai_tai_lieu: { type: DataTypes.ENUM('sach', 'bao', 'tap_chi', 'luan_van', 'khac'), defaultValue: 'sach' },
  ky_hieu_phan_loai: DataTypes.STRING(50),
  tu_khoa: DataTypes.TEXT,
  mo_ta: DataTypes.TEXT,
  ngon_ngu: { type: DataTypes.STRING(50), defaultValue: 'Tiếng Việt' },
  so_trang: DataTypes.INTEGER,
  bia_sach_url: DataTypes.STRING(500),
  trang_thai: {
    type: DataTypes.ENUM('cho_bien_muc', 'hoat_dong', 'cho_bo_sung_thong_tin', 'ngung_luu_thong'),
    defaultValue: 'cho_bien_muc',
  },
  so_luong_ban_sao: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'tai_lieu', underscored: true });

// ─── BanSao ───────────────────────────────────────────────────────────────────
const BanSao = sequelize.define('BanSao', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_ban_sao: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  tai_lieu_id: { type: DataTypes.INTEGER, allowNull: false },
  vi_tri_ke: DataTypes.STRING(100),
  trang_thai: {
    type: DataTypes.ENUM(
      'cho_bien_muc', 'cho_bo_sung_thong_tin', 'san_sang',
      'dang_muon', 'dat_truoc', 'mat', 'hu_hong_cho_xu_ly', 'da_thanh_ly'
    ),
    defaultValue: 'cho_bien_muc',
  },
  gia_tri: DataTypes.DECIMAL(15, 2),
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'ban_sao', underscored: true });

// ─── BanDoc ───────────────────────────────────────────────────────────────────
const BanDoc = sequelize.define('BanDoc', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_the: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  ho_ten: { type: DataTypes.STRING(100), allowNull: false },
  ngay_sinh: DataTypes.DATEONLY,
  email: DataTypes.STRING(150),
  so_dien_thoai: DataTypes.STRING(20),
  dia_chi: DataTypes.TEXT,
  so_cmnd: { type: DataTypes.STRING(20), unique: true },
  ma_sinh_vien: { type: DataTypes.STRING(20), unique: true },
  don_vi: DataTypes.STRING(200),
  hang_muc: { type: DataTypes.ENUM('sinh_vien', 'giang_vien', 'nhan_vien', 'ngoai'), defaultValue: 'sinh_vien' },
  trang_thai_the: {
    type: DataTypes.ENUM('hoat_dong', 'bi_khoa', 'het_han', 'da_huy'),
    defaultValue: 'hoat_dong',
  },
  ngay_dang_ky: { type: DataTypes.DATEONLY, allowNull: false },
  ngay_het_han: { type: DataTypes.DATEONLY, allowNull: false },
  password_hash: DataTypes.STRING(255),
  ly_do_khoa: DataTypes.TEXT,
}, { tableName: 'ban_doc', underscored: true });

// ─── CauHinhQuyDinh ───────────────────────────────────────────────────────────
const CauHinhQuyDinh = sequelize.define('CauHinhQuyDinh', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hang_muc_ban_doc: { type: DataTypes.ENUM('sinh_vien', 'giang_vien', 'nhan_vien', 'ngoai'), allowNull: false },
  loai_tai_lieu: { type: DataTypes.STRING(20), defaultValue: 'mac_dinh' },
  so_muon_toi_da: { type: DataTypes.INTEGER, defaultValue: 5 },
  thoi_han_muon_ngay: { type: DataTypes.INTEGER, defaultValue: 14 },
  so_lan_gia_han_toi_da: { type: DataTypes.INTEGER, defaultValue: 2 },
  muc_phat_ngay: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1000 },
  muc_tran_phat: DataTypes.DECIMAL(10, 2),
  thoi_gian_giu_cho_ngay: { type: DataTypes.INTEGER, defaultValue: 3 },
}, { tableName: 'cau_hinh_quy_dinh', underscored: true });

// ─── PhieuMuon ────────────────────────────────────────────────────────────────
const PhieuMuon = sequelize.define('PhieuMuon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_phieu_muon: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  ban_sao_id: { type: DataTypes.INTEGER, allowNull: false },
  ban_doc_id: { type: DataTypes.INTEGER, allowNull: false },
  nhan_vien_id: DataTypes.INTEGER,
  ngay_muon: { type: DataTypes.DATEONLY, allowNull: false },
  ngay_hen_tra: { type: DataTypes.DATEONLY, allowNull: false },
  ngay_tra_thuc_te: DataTypes.DATEONLY,
  so_lan_gia_han: { type: DataTypes.INTEGER, defaultValue: 0 },
  trang_thai: {
    type: DataTypes.ENUM('dang_muon', 'da_tra_dung_han', 'da_tra_tre_han', 'bao_mat', 'bao_hong', 'da_xu_ly_mat_hong'),
    defaultValue: 'dang_muon',
  },
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'phieu_muon', underscored: true });

// ─── DatTruoc ─────────────────────────────────────────────────────────────────
const DatTruoc = sequelize.define('DatTruoc', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_dat_truoc: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  tai_lieu_id: { type: DataTypes.INTEGER, allowNull: false },
  ban_doc_id: { type: DataTypes.INTEGER, allowNull: false },
  ban_sao_id: DataTypes.INTEGER,
  ngay_dat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  vi_tri_hang_doi: { type: DataTypes.INTEGER, defaultValue: 1 },
  han_lay_sach: DataTypes.DATEONLY,
  trang_thai: {
    type: DataTypes.ENUM('dang_cho', 'da_thong_bao', 'da_muon', 'da_huy_ban_doc', 'da_huy_het_han'),
    defaultValue: 'dang_cho',
  },
}, { tableName: 'dat_truoc', underscored: true });

// ─── PhieuPhat ────────────────────────────────────────────────────────────────
const PhieuPhat = sequelize.define('PhieuPhat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_phieu_phat: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  phieu_muon_id: { type: DataTypes.INTEGER, allowNull: false },
  ban_doc_id: { type: DataTypes.INTEGER, allowNull: false },
  loai_phat: { type: DataTypes.ENUM('tre_han', 'mat_sach', 'hong_sach', 'phi_sua_chua'), allowNull: false },
  so_tien: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  so_ngay_tre: DataTypes.INTEGER,
  trang_thai_thanh_toan: {
    type: DataTypes.ENUM('chua_thanh_toan', 'da_thanh_toan', 'da_mien_giam'),
    defaultValue: 'chua_thanh_toan',
  },
  so_tien_mien_giam: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  ly_do_mien_giam: DataTypes.TEXT,
  nhan_vien_duyet_id: DataTypes.INTEGER,
  ngay_thanh_toan: DataTypes.DATE,
}, { tableName: 'phieu_phat', underscored: true });

// ─── DonDatHang ───────────────────────────────────────────────────────────────
const DonDatHang = sequelize.define('DonDatHang', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_don: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nha_cung_cap_id: DataTypes.INTEGER,
  nhan_vien_id: { type: DataTypes.INTEGER, allowNull: false },
  nguoi_duyet_id: DataTypes.INTEGER,
  ngay_lap: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  ngay_du_kien_giao: DataTypes.DATEONLY,
  ngay_duyet: DataTypes.DATE,
  trang_thai: {
    type: DataTypes.ENUM('cho_duyet', 'da_duyet', 'tu_choi', 'da_dat_hang', 'da_nhan_mot_phan', 'hoan_thanh', 'da_huy'),
    defaultValue: 'cho_duyet',
  },
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'don_dat_hang', underscored: true });

// ─── ChiTietDonDatHang ────────────────────────────────────────────────────────
const ChiTietDonDatHang = sequelize.define('ChiTietDonDatHang', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  don_dat_hang_id: { type: DataTypes.INTEGER, allowNull: false },
  tai_lieu_id: DataTypes.INTEGER,
  nhan_de_du_kien: DataTypes.STRING(500),
  tac_gia_du_kien: DataTypes.STRING(300),
  isbn_du_kien: DataTypes.STRING(20),
  so_luong_dat: { type: DataTypes.INTEGER, defaultValue: 1 },
  don_gia_du_kien: DataTypes.DECIMAL(15, 2),
  so_luong_da_nhan: { type: DataTypes.INTEGER, defaultValue: 0 },
  so_luong_loi: { type: DataTypes.INTEGER, defaultValue: 0 },
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'chi_tiet_don_dat_hang', underscored: true });

// ─── KiemKe ───────────────────────────────────────────────────────────────────
const KiemKe = sequelize.define('KiemKe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_kiem_ke: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nhan_vien_id: { type: DataTypes.INTEGER, allowNull: false },
  ngay_bat_dau: DataTypes.DATEONLY,
  ngay_ket_thuc: DataTypes.DATEONLY,
  khu_vuc: DataTypes.STRING(200),
  trang_thai: { type: DataTypes.ENUM('dang_kiem_ke', 'hoan_thanh'), defaultValue: 'dang_kiem_ke' },
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'kiem_ke', underscored: true });

// ─── ChiTietKiemKe ────────────────────────────────────────────────────────────
const ChiTietKiemKe = sequelize.define('ChiTietKiemKe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kiem_ke_id: { type: DataTypes.INTEGER, allowNull: false },
  ban_sao_id: { type: DataTypes.INTEGER, allowNull: false },
  trang_thai_he_thong: { type: DataTypes.STRING(30), allowNull: false },
  trang_thai_thuc_te: { type: DataTypes.ENUM('co_mat', 'thieu', 'sai_vi_tri', 'hu_hong'), defaultValue: 'co_mat' },
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'chi_tiet_kiem_ke', underscored: true });

// ─── NhatKyThayDoi ────────────────────────────────────────────────────────────
const NhatKyThayDoi = sequelize.define('NhatKyThayDoi', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loai_doi_tuong: { type: DataTypes.STRING(50), allowNull: false },
  doi_tuong_id: { type: DataTypes.INTEGER, allowNull: false },
  hanh_dong: { type: DataTypes.ENUM('tao_moi', 'cap_nhat', 'xoa', 'khoa', 'mo_khoa', 'duyet', 'tu_choi') },
  du_lieu_truoc: DataTypes.JSONB,
  du_lieu_sau: DataTypes.JSONB,
  nhan_vien_id: DataTypes.INTEGER,
  ban_doc_id: DataTypes.INTEGER,
  dia_chi_ip: DataTypes.STRING(45),
  ghi_chu: DataTypes.TEXT,
}, { tableName: 'nhat_ky_thay_doi', underscored: true, updatedAt: false });

// ─── Associations ─────────────────────────────────────────────────────────────
TaiLieu.hasMany(BanSao, { foreignKey: 'tai_lieu_id', as: 'banSao' });
BanSao.belongsTo(TaiLieu, { foreignKey: 'tai_lieu_id', as: 'taiLieu' });

TaiLieu.hasMany(DatTruoc, { foreignKey: 'tai_lieu_id', as: 'datTruoc' });
DatTruoc.belongsTo(TaiLieu, { foreignKey: 'tai_lieu_id', as: 'taiLieu' });

BanSao.hasMany(PhieuMuon, { foreignKey: 'ban_sao_id', as: 'phieuMuon' });
PhieuMuon.belongsTo(BanSao, { foreignKey: 'ban_sao_id', as: 'banSao' });

BanSao.hasMany(DatTruoc, { foreignKey: 'ban_sao_id', as: 'datTruoc' });
DatTruoc.belongsTo(BanSao, { foreignKey: 'ban_sao_id', as: 'banSao' });

BanDoc.hasMany(PhieuMuon, { foreignKey: 'ban_doc_id', as: 'phieuMuon' });
PhieuMuon.belongsTo(BanDoc, { foreignKey: 'ban_doc_id', as: 'banDoc' });

BanDoc.hasMany(DatTruoc, { foreignKey: 'ban_doc_id', as: 'datTruoc' });
DatTruoc.belongsTo(BanDoc, { foreignKey: 'ban_doc_id', as: 'banDoc' });

BanDoc.hasMany(PhieuPhat, { foreignKey: 'ban_doc_id', as: 'phieuPhat' });
PhieuPhat.belongsTo(BanDoc, { foreignKey: 'ban_doc_id', as: 'banDoc' });

PhieuMuon.hasMany(PhieuPhat, { foreignKey: 'phieu_muon_id', as: 'phieuPhat' });
PhieuPhat.belongsTo(PhieuMuon, { foreignKey: 'phieu_muon_id', as: 'phieuMuon' });

NhanVien.hasMany(PhieuMuon, { foreignKey: 'nhan_vien_id', as: 'phieuMuon' });
PhieuMuon.belongsTo(NhanVien, { foreignKey: 'nhan_vien_id', as: 'nhanVien' });

NhanVien.hasMany(PhieuPhat, { foreignKey: 'nhan_vien_duyet_id', as: 'phieuPhatDuyet' });
PhieuPhat.belongsTo(NhanVien, { foreignKey: 'nhan_vien_duyet_id', as: 'nhanVienDuyet' });

NhaCungCap.hasMany(DonDatHang, { foreignKey: 'nha_cung_cap_id', as: 'donDatHang' });
DonDatHang.belongsTo(NhaCungCap, { foreignKey: 'nha_cung_cap_id', as: 'nhaCungCap' });

NhaCungCap.hasMany(TaiLieu, { foreignKey: 'nha_cung_cap_id', as: 'taiLieu' });
TaiLieu.belongsTo(NhaCungCap, { foreignKey: 'nha_cung_cap_id', as: 'nhaCungCap' });

NhanVien.hasMany(DonDatHang, { foreignKey: 'nhan_vien_id', as: 'donDatHang' });
DonDatHang.belongsTo(NhanVien, { foreignKey: 'nhan_vien_id', as: 'nhanVien' });

DonDatHang.hasMany(ChiTietDonDatHang, { foreignKey: 'don_dat_hang_id', as: 'chiTiet' });
ChiTietDonDatHang.belongsTo(DonDatHang, { foreignKey: 'don_dat_hang_id', as: 'donDatHang' });

TaiLieu.hasMany(ChiTietDonDatHang, { foreignKey: 'tai_lieu_id', as: 'chiTietDonDatHang' });
ChiTietDonDatHang.belongsTo(TaiLieu, { foreignKey: 'tai_lieu_id', as: 'taiLieu' });

NhanVien.hasMany(KiemKe, { foreignKey: 'nhan_vien_id', as: 'kiemKe' });
KiemKe.belongsTo(NhanVien, { foreignKey: 'nhan_vien_id', as: 'nhanVien' });

KiemKe.hasMany(ChiTietKiemKe, { foreignKey: 'kiem_ke_id', as: 'chiTiet' });
ChiTietKiemKe.belongsTo(KiemKe, { foreignKey: 'kiem_ke_id', as: 'kiemKe' });

BanSao.hasMany(ChiTietKiemKe, { foreignKey: 'ban_sao_id', as: 'chiTietKiemKe' });
ChiTietKiemKe.belongsTo(BanSao, { foreignKey: 'ban_sao_id', as: 'banSao' });

NhanVien.hasMany(NhatKyThayDoi, { foreignKey: 'nhan_vien_id', as: 'nhatKy' });
BanDoc.hasMany(NhatKyThayDoi, { foreignKey: 'ban_doc_id', as: 'nhatKy' });

module.exports = {
  sequelize,
  NhanVien, NhaCungCap, TaiLieu, BanSao, BanDoc, CauHinhQuyDinh,
  PhieuMuon, DatTruoc, PhieuPhat, DonDatHang, ChiTietDonDatHang,
  KiemKe, ChiTietKiemKe, NhatKyThayDoi,
};
