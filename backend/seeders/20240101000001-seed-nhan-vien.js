'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const now = new Date();

    await queryInterface.bulkInsert('nhan_vien', [
      {
        ma_nhan_vien: 'NV001',
        ho_ten: 'Nguyễn Văn Admin',
        email: 'admin@library.edu.vn',
        password_hash: await bcrypt.hash('Admin@123', salt),
        vai_tro: 'admin',
        trang_thai: 'hoat_dong',
        so_dien_thoai: '0901000001',
        created_at: now,
        updated_at: now,
      },
      {
        ma_nhan_vien: 'NV002',
        ho_ten: 'Trần Thị Quản Lý',
        email: 'manager@library.edu.vn',
        password_hash: await bcrypt.hash('Manager@123', salt),
        vai_tro: 'quan_ly',
        trang_thai: 'hoat_dong',
        so_dien_thoai: '0901000002',
        created_at: now,
        updated_at: now,
      },
      {
        ma_nhan_vien: 'NV003',
        ho_ten: 'Lê Văn Thủ Thư',
        email: 'librarian@library.edu.vn',
        password_hash: await bcrypt.hash('Librarian@123', salt),
        vai_tro: 'thu_thu',
        trang_thai: 'hoat_dong',
        so_dien_thoai: '0901000003',
        created_at: now,
        updated_at: now,
      },
      {
        ma_nhan_vien: 'NV004',
        ho_ten: 'Phạm Thị Thu Thư 2',
        email: 'librarian2@library.edu.vn',
        password_hash: await bcrypt.hash('Librarian@123', salt),
        vai_tro: 'thu_thu',
        trang_thai: 'hoat_dong',
        so_dien_thoai: '0901000004',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('nhan_vien', null, {});
  },
};
