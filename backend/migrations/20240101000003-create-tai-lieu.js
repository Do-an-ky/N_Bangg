'use strict';

// Thực thể TaiLieu — đầu sách (A1, A2, A3, A4, C1)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tai_lieu', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_tai_lieu: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
        comment: 'Mã tài liệu nội bộ, VD: TL00001',
      },
      nhan_de: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      tac_gia: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      nha_xuat_ban: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      nam_xuat_ban: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isbn: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'ISBN-10 hoặc ISBN-13; null nếu tài liệu không có ISBN (A2-Exc1)',
      },
      // Phân loại theo A2
      the_loai: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Chủ đề/thể loại nội dung',
      },
      loai_tai_lieu: {
        type: Sequelize.ENUM('sach', 'bao', 'tap_chi', 'luan_van', 'khac'),
        defaultValue: 'sach',
        allowNull: false,
        comment: 'Loại tài liệu ảnh hưởng đến thời hạn mượn (E2)',
      },
      ky_hieu_phan_loai: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Ký hiệu DDC/LCC từ A2',
      },
      tu_khoa: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Từ khóa phân cách bằng dấu phẩy, hỗ trợ tra cứu C1',
      },
      mo_ta: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ngon_ngu: {
        type: Sequelize.STRING(50),
        defaultValue: 'Tiếng Việt',
      },
      so_trang: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bia_sach_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      // A2-Exc1: tài liệu thiếu thông tin chưa hiển thị công khai
      trang_thai: {
        type: Sequelize.ENUM('cho_bien_muc', 'hoat_dong', 'cho_bo_sung_thong_tin', 'ngung_luu_thong'),
        defaultValue: 'cho_bien_muc',
        allowNull: false,
      },
      so_luong_ban_sao: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Tổng số bản sao vật lý (tự động cập nhật)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index hỗ trợ tra cứu C1
    await queryInterface.addIndex('tai_lieu', ['nhan_de'], { name: 'idx_tai_lieu_nhan_de' });
    await queryInterface.addIndex('tai_lieu', ['tac_gia'], { name: 'idx_tai_lieu_tac_gia' });
    await queryInterface.addIndex('tai_lieu', ['isbn'], { name: 'idx_tai_lieu_isbn' });
    await queryInterface.addIndex('tai_lieu', ['trang_thai'], { name: 'idx_tai_lieu_trang_thai' });
    await queryInterface.addIndex('tai_lieu', ['loai_tai_lieu'], { name: 'idx_tai_lieu_loai' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tai_lieu');
  },
};
