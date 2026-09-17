'use strict';
const bcrypt = require('bcryptjs');

// Bạn đọc mẫu để kiểm thử các luồng B, C, D
module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];

    await queryInterface.bulkInsert('ban_doc', [
      {
        ma_the: 'BD2024001',
        ho_ten: 'Nguyễn Thị Hương',
        ngay_sinh: '2002-05-15',
        email: 'reader@example.com',
        so_dien_thoai: '0912345678',
        so_cmnd: '001234567890',
        ma_sinh_vien: 'SV20240001',
        don_vi: 'Khoa Công nghệ Thông tin - Lớp CNTT2024A',
        hang_muc: 'sinh_vien',
        trang_thai_the: 'hoat_dong',
        ngay_dang_ky: today,
        ngay_het_han: nextYear,
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
      {
        ma_the: 'BD2024002',
        ho_ten: 'Trần Văn Minh',
        ngay_sinh: '2001-08-20',
        email: 'minh.tran@student.edu.vn',
        so_dien_thoai: '0923456789',
        so_cmnd: '001234567891',
        ma_sinh_vien: 'SV20240002',
        don_vi: 'Khoa Toán - Lớp TIN2024B',
        hang_muc: 'sinh_vien',
        trang_thai_the: 'hoat_dong',
        ngay_dang_ky: today,
        ngay_het_han: nextYear,
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
      // Bạn đọc bị khóa thẻ — test C3-Exc1
      {
        ma_the: 'BD2024003',
        ho_ten: 'Lê Văn Bị Khóa',
        ngay_sinh: '2000-01-10',
        email: 'locked@example.com',
        so_dien_thoai: '0934567890',
        so_cmnd: '001234567892',
        ma_sinh_vien: 'SV20230010',
        don_vi: 'Khoa Cơ khí',
        hang_muc: 'sinh_vien',
        trang_thai_the: 'bi_khoa',
        ly_do_khoa: 'Mất 2 tài liệu và không nộp bồi thường trong 30 ngày',
        ngay_dang_ky: '2023-09-01',
        ngay_het_han: nextYear,
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
      // Bạn đọc giảng viên — có định mức mượn cao hơn
      {
        ma_the: 'GV2024001',
        ho_ten: 'PGS.TS. Nguyễn Văn Giáo Viên',
        ngay_sinh: '1975-03-22',
        email: 'giaovien@university.edu.vn',
        so_dien_thoai: '0945678901',
        so_cmnd: '001234567893',
        don_vi: 'Bộ môn Khoa học Máy tính',
        hang_muc: 'giang_vien',
        trang_thai_the: 'hoat_dong',
        ngay_dang_ky: '2020-01-01',
        ngay_het_han: nextYear,
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
      // Bạn đọc thẻ sắp hết hạn — test B2
      {
        ma_the: 'BD2023099',
        ho_ten: 'Phạm Thị Sắp Hết Hạn',
        ngay_sinh: '2002-11-30',
        email: 'sap_het_han@example.com',
        so_dien_thoai: '0956789012',
        so_cmnd: '001234567894',
        ma_sinh_vien: 'SV20230099',
        don_vi: 'Khoa Điện tử',
        hang_muc: 'sinh_vien',
        trang_thai_the: 'hoat_dong',
        ngay_dang_ky: '2023-09-01',
        ngay_het_han: nextMonth,  // sắp hết hạn
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
      // Bạn đọc có công nợ chưa thanh toán — test C3-Exc3, D3
      {
        ma_the: 'BD2023050',
        ho_ten: 'Hoàng Văn Nợ Phạt',
        ngay_sinh: '2001-07-15',
        email: 'no_phat@example.com',
        so_dien_thoai: '0967890123',
        so_cmnd: '001234567895',
        ma_sinh_vien: 'SV20230050',
        don_vi: 'Khoa Xây dựng',
        hang_muc: 'sinh_vien',
        trang_thai_the: 'hoat_dong',
        ngay_dang_ky: '2023-09-01',
        ngay_het_han: nextYear,
        password_hash: await bcrypt.hash('Reader@123', salt),
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ban_doc', null, {});
  },
};
