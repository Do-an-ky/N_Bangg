'use strict';
const Joi = require('joi');

const staffLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  matKhau: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu tối thiểu 6 ký tự',
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

const memberLoginSchema = Joi.object({
  maThe: Joi.string().required().messages({ 'any.required': 'Vui lòng nhập mã thẻ' }),
  matKhau: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu tối thiểu 6 ký tự',
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

const setPasswordSchema = Joi.object({
  matKhau: Joi.string().min(6).required(),
});

module.exports = { staffLoginSchema, memberLoginSchema, setPasswordSchema };
