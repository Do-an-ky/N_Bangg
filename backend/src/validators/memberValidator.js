'use strict';
const Joi = require('joi');

const registerMemberSchema = Joi.object({
  hoTen: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Họ tên tối thiểu 2 ký tự',
    'any.required': 'Vui lòng nhập họ tên',
  }),
  ngaySinh: Joi.date().max('now').optional().allow(null, '').messages({
    'date.max': 'Ngày sinh không hợp lệ',
  }),
  email: Joi.string().email().optional().allow(null, '').messages({
    'string.email': 'Email không hợp lệ',
  }),
  soDienThoai: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow(null, '').messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (9-11 số)',
  }),
  diaChi: Joi.string().max(255).optional().allow(null, ''),
  soCmnd: Joi.string().pattern(/^[0-9]{9,12}$/).optional().allow(null, '').messages({
    'string.pattern.base': 'CMND/CCCD không hợp lệ (9-12 số)',
  }),
  maSinhVien: Joi.string().max(20).optional().allow(null, ''),
  donVi: Joi.string().max(100).optional().allow(null, ''),
  hangMuc: Joi.string().valid('sinh_vien', 'giang_vien', 'ngoai').default('sinh_vien'),
  password: Joi.string().min(6).optional().allow(null, ''),
});

const updateMemberSchema = Joi.object({
  hoTen: Joi.string().min(2).max(100).optional(),
  ngaySinh: Joi.date().max('now').optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  soDienThoai: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow(null, ''),
  diaChi: Joi.string().max(255).optional().allow(null, ''),
  donVi: Joi.string().max(100).optional().allow(null, ''),
});

const lockMemberSchema = Joi.object({
  lyDo: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Lý do khóa tối thiểu 5 ký tự',
    'any.required': 'Vui lòng nhập lý do khóa thẻ',
  }),
});

module.exports = { registerMemberSchema, updateMemberSchema, lockMemberSchema };
