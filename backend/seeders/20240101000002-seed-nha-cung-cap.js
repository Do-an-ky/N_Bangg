'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('nha_cung_cap', [
      {
        ma_nha_cung_cap: 'NCC001',
        ten: 'Công ty Sách Giáo Dục Việt Nam',
        dia_chi: '25 Hàn Thuyên, Hà Nội',
        so_dien_thoai: '024 3822 0801',
        email: 'contact@sach-giao-duc.vn',
        website: 'https://sach-giao-duc.vn',
        trang_thai: 'hoat_dong',
        created_at: now,
        updated_at: now,
      },
      {
        ma_nha_cung_cap: 'NCC002',
        ten: 'Nhà sách Fahasa',
        dia_chi: '185 Nguyễn Thị Minh Khai, TP.HCM',
        so_dien_thoai: '028 3822 0856',
        email: 'fahasa@fahasa.com',
        website: 'https://fahasa.com',
        trang_thai: 'hoat_dong',
        created_at: now,
        updated_at: now,
      },
      {
        ma_nha_cung_cap: 'NCC003',
        ten: 'Nhà Xuất Bản Đại Học Quốc Gia Hà Nội',
        dia_chi: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
        so_dien_thoai: '024 3754 7903',
        email: 'nxb@vnu.edu.vn',
        trang_thai: 'hoat_dong',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('nha_cung_cap', null, {});
  },
};
