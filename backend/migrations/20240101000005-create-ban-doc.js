'use strict';

// Thực thể BanDoc — bạn đọc/thành viên (B1–B4)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ban_doc', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_the: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Mã thẻ thư viện, VD: BD2024001',
      },
      ho_ten: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      ngay_sinh: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true,
        unique: true,
      },
      so_dien_thoai: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      dia_chi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // B1-Exc1: kiểm tra trùng CMND/mã sinh viên
      so_cmnd: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        comment: 'CMND/CCCD; dùng phát hiện trùng thẻ (B1-Exc1)',
      },
      ma_sinh_vien: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      don_vi: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Khoa/Lớp/Phòng ban',
      },
      // B1: hạng mục quyết định định mức mượn (liên kết CauHinhQuyDinh E2)
      hang_muc: {
        type: Sequelize.ENUM('sinh_vien', 'giang_vien', 'nhan_vien', 'ngoai'),
        allowNull: false,
        defaultValue: 'sinh_vien',
      },
      // Vòng đời thẻ bạn đọc (mục 10)
      trang_thai_the: {
        type: Sequelize.ENUM('hoat_dong', 'bi_khoa', 'het_han', 'da_huy'),
        defaultValue: 'hoat_dong',
        allowNull: false,
      },
      ngay_dang_ky: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      ngay_het_han: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày hết hạn thẻ; gia hạn qua B2',
      },
      // Bạn đọc cần đăng nhập vào OPAC để tra cứu/đặt trước/gia hạn
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'null nếu chưa kích hoạt tài khoản online',
      },
      ly_do_khoa: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lý do khi B3-Alt1 khóa thẻ',
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

    await queryInterface.addIndex('ban_doc', ['ma_the'], { name: 'idx_ban_doc_ma_the' });
    await queryInterface.addIndex('ban_doc', ['so_cmnd'], { name: 'idx_ban_doc_cmnd' });
    await queryInterface.addIndex('ban_doc', ['trang_thai_the'], { name: 'idx_ban_doc_trang_thai' });
    await queryInterface.addIndex('ban_doc', ['hang_muc'], { name: 'idx_ban_doc_hang_muc' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ban_doc');
  },
};
