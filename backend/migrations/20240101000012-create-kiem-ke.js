'use strict';

// A5 - Kiểm kê định kỳ: phiên kiểm kê
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kiem_ke', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_kiem_ke: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      nhan_vien_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ngay_bat_dau: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ngay_ket_thuc: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      khu_vuc: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Khu vực kiểm kê, VD: Kho A - Tầng 2',
      },
      trang_thai: {
        type: Sequelize.ENUM('dang_kiem_ke', 'hoan_thanh'),
        defaultValue: 'dang_kiem_ke',
      },
      ghi_chu: {
        type: Sequelize.TEXT,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('kiem_ke');
  },
};
