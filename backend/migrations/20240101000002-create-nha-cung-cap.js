'use strict';

// A1 - Bổ sung tài liệu mới: Nhà cung cấp giao hàng
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nha_cung_cap', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_nha_cung_cap: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      dia_chi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      so_dien_thoai: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ghi_chu: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      trang_thai: {
        type: Sequelize.ENUM('hoat_dong', 'ngung_hop_tac'),
        defaultValue: 'hoat_dong',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('nha_cung_cap');
  },
};
