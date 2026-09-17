'use strict';

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode || 500;
    this.code = code || 'INTERNAL_ERROR';
    this.isOperational = true;
  }
}

// 400 - Bad request / validation
class ValidationError extends AppError {
  constructor(message, code) {
    super(message, 400, code || 'VALIDATION_ERROR');
  }
}

// 401 - Unauthenticated
class AuthError extends AppError {
  constructor(message) {
    super(message || 'Chưa đăng nhập hoặc phiên đã hết hạn', 401, 'UNAUTHORIZED');
  }
}

// 403 - Forbidden
class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Không có quyền thực hiện thao tác này', 403, 'FORBIDDEN');
  }
}

// 404 - Not found
class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource || 'Tài nguyên'} không tồn tại`, 404, 'NOT_FOUND');
  }
}

// 409 - Business rule conflict
class BusinessRuleError extends AppError {
  constructor(message, code) {
    super(message, 409, code || 'BUSINESS_RULE_VIOLATION');
  }
}

// Business rule codes mapping to HCI error messages (Nielsen #9)
const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa. Liên hệ quản trị viên để được hỗ trợ',

  // B-group: Member
  MEMBER_DUPLICATE: 'Đã tồn tại thẻ bạn đọc với số CMND/CCCD hoặc mã sinh viên này',
  MEMBER_NOT_FOUND: 'Không tìm thấy bạn đọc',
  CARD_LOCKED: 'Thẻ bạn đọc đang bị khóa. Liên hệ thủ thư để được hỗ trợ',
  CARD_EXPIRED: 'Thẻ bạn đọc đã hết hạn. Vui lòng gia hạn thẻ (B2)',
  CARD_CANCELLED: 'Thẻ bạn đọc đã bị hủy',
  RENEW_CARD_HAS_DEBT: 'Không thể gia hạn thẻ khi còn công nợ chưa thanh toán',
  RENEW_CARD_HAS_OVERDUE: 'Không thể gia hạn thẻ khi còn tài liệu quá hạn chưa trả',
  CANCEL_CARD_HAS_LOAN: 'Không thể hủy thẻ khi còn tài liệu đang mượn',
  CANCEL_CARD_HAS_DEBT: 'Không thể hủy thẻ khi còn công nợ chưa thanh toán',

  // C3: Checkout
  COPY_NOT_AVAILABLE: 'Tài liệu không ở trạng thái sẵn sàng cho mượn',
  LOAN_MAX_EXCEEDED: 'Bạn đã đạt số lượng tài liệu mượn tối đa',
  HAS_UNPAID_DEBT: 'Bạn còn công nợ/phạt chưa thanh toán. Vui lòng thanh toán trước khi mượn thêm',
  COPY_RESERVED_BY_OTHER: 'Bản sao này đang được giữ cho bạn đọc khác (đặt trước)',

  // C5: Renew
  LOAN_OVERDUE: 'Không thể gia hạn: tài liệu đã quá hạn. Vui lòng trả và thanh toán phạt',
  RENEW_HAS_RESERVATION: 'Không thể gia hạn: có bạn đọc khác đang đặt trước tài liệu này',
  RENEW_MAX_EXCEEDED: 'Đã đạt số lần gia hạn tối đa cho phép',
  LOAN_NOT_ACTIVE: 'Phiếu mượn không ở trạng thái đang mượn',

  // C2: Reservation
  ALREADY_RESERVED: 'Bạn đã đặt trước tài liệu này',
  BOOK_AVAILABLE: 'Tài liệu đang có sẵn, bạn có thể mượn trực tiếp',

  // A4: Discard
  COPY_ON_LOAN: 'Không thể thanh lý bản sao đang được mượn hoặc đặt trước',

  // General
  LOAN_NOT_FOUND: 'Không tìm thấy phiếu mượn',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao tài liệu',
  RESERVATION_NOT_FOUND: 'Không tìm thấy yêu cầu đặt trước',
};

module.exports = {
  AppError, ValidationError, AuthError, ForbiddenError, NotFoundError, BusinessRuleError,
  ERROR_CODES,
};
