'use strict';

// E1 - Quản lý tài khoản & phân quyền nhân viên
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nhan_vien', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_nhan_vien: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Mã nhân viên duy nhất, VD: NV001',
      },
      ho_ten: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // E1: vai trò xác định quyền hạn (RBAC)
      vai_tro: {
        type: Sequelize.ENUM('thu_thu', 'quan_ly', 'admin'),
        allowNull: false,
        comment: 'thu_thu: xử lý mượn/trả; quan_ly: duyệt thanh lý/miễn phạt/báo cáo; admin: quản lý tài khoản/cấu hình',
      },
      trang_thai: {
        type: Sequelize.ENUM('hoat_dong', 'bi_khoa'),
        defaultValue: 'hoat_dong',
        allowNull: false,
      },
      so_dien_thoai: {
        type: Sequelize.STRING(20),
        allowNull: true,
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

    await queryInterface.addIndex('nhan_vien', ['email'], { name: 'idx_nhan_vien_email' });
    await queryInterface.addIndex('nhan_vien', ['vai_tro'], { name: 'idx_nhan_vien_vai_tro' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('nhan_vien');
  },
};
