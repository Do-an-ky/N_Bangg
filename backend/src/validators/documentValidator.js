'use strict';
const Joi = require('joi');

const loaiTaiLieuValues = ['sach', 'bao', 'tap_chi', 'luan_van', 'khac'];

// A1: Tạo tài liệu
const createDocumentSchema = Joi.object({
  nhanDe: Joi.string().min(2).max(500).required().messages({
    'any.required': 'Vui lòng nhập tên tài liệu',
    'string.min': 'Tên tài liệu tối thiểu 2 ký tự',
  }),
  tacGia: Joi.string().max(300).required().messages({ 'any.required': 'Vui lòng nhập tên tác giả' }),
  nhaXuatBan: Joi.string().max(200).optional().allow(null, ''),
  namXuatBan: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional().allow(null),
  isbn: Joi.string().max(20).optional().allow(null, ''),
  loaiTaiLieu: Joi.string().valid(...loaiTaiLieuValues).default('sach'),
  theLoai: Joi.string().max(100).optional().allow(null, ''),
  moTa: Joi.string().max(2000).optional().allow(null, ''),
  tuKhoa: Joi.string().max(500).optional().allow(null, ''),
  biaSachUrl: Joi.string().uri().optional().allow(null, ''),
  nhaCungCapId: Joi.number().integer().optional().allow(null),
});

// A2: Biên mục (cho phép cập nhật bất kỳ trường)
const catalogDocumentSchema = Joi.object({
  nhanDe: Joi.string().min(2).max(500).optional(),
  tacGia: Joi.string().max(200).optional().allow(null, ''),
  nhaXuatBan: Joi.string().max(200).optional().allow(null, ''),
  namXuatBan: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional().allow(null),
  isbn: Joi.string().max(20).optional().allow(null, ''),
  loaiTaiLieu: Joi.string().valid(...loaiTaiLieuValues).optional(),
  theLoai: Joi.string().max(100).optional().allow(null, ''),
  moTa: Joi.string().max(2000).optional().allow(null, ''),
  tuKhoa: Joi.string().max(500).optional().allow(null, ''),
  biaSachUrl: Joi.string().uri().optional().allow(null, ''),
});

// A3: Cập nhật
const updateDocumentSchema = catalogDocumentSchema;

// Thêm bản sao
const addCopiesSchema = Joi.object({
  banSao: Joi.array().items(Joi.object({
    viTriKe: Joi.string().max(100).optional().allow(null, ''),
    giaTri: Joi.number().min(0).optional(),
    ghiChu: Joi.string().max(500).optional().allow(null, ''),
  })).min(1).required().messages({
    'array.min': 'Phải thêm ít nhất 1 bản sao',
    'any.required': 'Vui lòng cung cấp danh sách bản sao',
  }),
});

// A4: Thanh lý
const discardCopySchema = Joi.object({
  lyDo: Joi.string().min(5).max(500).required().messages({
    'any.required': 'Vui lòng nhập lý do thanh lý',
    'string.min': 'Lý do thanh lý tối thiểu 5 ký tự',
  }),
});

// A5: Nhà cung cấp
const supplierSchema = Joi.object({
  tenNhaCungCap: Joi.string().min(2).max(200).required().messages({
    'any.required': 'Vui lòng nhập tên nhà cung cấp',
  }),
  diaChi: Joi.string().max(500).optional().allow(null, ''),
  soDienThoai: Joi.string().pattern(/^[0-9+\-\s]{7,20}$/).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  nguoiLienHe: Joi.string().max(100).optional().allow(null, ''),
});

// A5: Đơn đặt hàng
const createOrderSchema = Joi.object({
  nhaCungCapId: Joi.number().integer().required().messages({
    'any.required': 'Vui lòng chọn nhà cung cấp',
  }),
  ghiChu: Joi.string().max(1000).optional().allow(null, ''),
  items: Joi.array().items(Joi.object({
    taiLieuId: Joi.string().uuid().optional().allow(null),
    tenTaiLieu: Joi.string().min(2).max(500).required(),
    soLuong: Joi.number().integer().min(1).required(),
    donGia: Joi.number().min(0).required(),
  })).min(1).required().messages({
    'array.min': 'Đơn đặt hàng phải có ít nhất 1 tài liệu',
    'any.required': 'Vui lòng thêm danh sách tài liệu cần đặt',
  }),
});

// Kiểm kê
const recordItemSchema = Joi.object({
  maBanSao: Joi.string().required().messages({ 'any.required': 'Vui lòng quét mã bản sao' }),
  tinhTrang: Joi.string().valid('co_mat', 'thieu', 'sai_vi_tri', 'hu_hong').required().messages({
    'any.required': 'Vui lòng chọn tình trạng bản sao',
    'any.only': 'Tình trạng phải là co_mat, thieu, sai_vi_tri hoặc hu_hong',
  }),
  ghiChu: Joi.string().max(500).optional().allow(null, ''),
});

module.exports = {
  createDocumentSchema, catalogDocumentSchema, updateDocumentSchema,
  addCopiesSchema, discardCopySchema,
  supplierSchema, createOrderSchema,
  recordItemSchema,
};
