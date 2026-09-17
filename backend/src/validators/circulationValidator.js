'use strict';
const Joi = require('joi');

// C2 - Đặt trước
const createReservationSchema = Joi.object({
  taiLieuId: Joi.number().integer().positive().required().messages({
    'any.required': 'Vui lòng chọn tài liệu cần đặt trước',
    'number.base': 'ID tài liệu không hợp lệ',
  }),
  banDocId: Joi.number().integer().positive().optional(), // chỉ nhân viên truyền thay
});

// C3 - Mượn sách
const checkoutSchema = Joi.object({
  banDocId: Joi.number().integer().positive().required().messages({ 'any.required': 'Vui lòng cung cấp mã bạn đọc' }),
  maBanSao: Joi.string().required().messages({ 'any.required': 'Vui lòng quét mã vạch bản sao' }),
});

// C4 - Trả sách
const returnSchema = Joi.object({
  maBanSao: Joi.string().required().messages({ 'any.required': 'Vui lòng quét mã vạch bản sao' }),
  tinhTrang: Joi.string().valid('ok', 'hong').default('ok'),
});

// C7 - Mất/hư hỏng
const reportLostSchema = Joi.object({
  loai: Joi.string().valid('bao_mat', 'bao_hong').required().messages({
    'any.only': 'Loại phải là bao_mat hoặc bao_hong',
    'any.required': 'Vui lòng chọn loại báo cáo',
  }),
});

// D1 - Miễn giảm phạt
const waiveFineSchema = Joi.object({
  // Nếu không truyền → miễn 100%
  soTienMienGiam: Joi.number().positive().optional().messages({
    'number.positive': 'Số tiền miễn giảm phải lớn hơn 0',
  }),
  lyDo: Joi.string().min(5).max(500).required().messages({
    'any.required': 'Vui lòng nhập lý do miễn giảm',
    'string.min': 'Lý do miễn giảm tối thiểu 5 ký tự',
  }),
});

module.exports = { createReservationSchema, checkoutSchema, returnSchema, reportLostSchema, waiveFineSchema };
