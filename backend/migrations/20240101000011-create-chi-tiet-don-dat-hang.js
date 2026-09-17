'use strict';

// A1 - Chi tiết từng đầu sách trong đơn đặt hàng
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chi_tiet_don_dat_hang', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      don_dat_hang_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'don_dat_hang', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // null nếu đây là đầu sách hoàn toàn mới chưa có trong hệ thống
      tai_lieu_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tai_lieu', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'null = tài liệu mới; có giá trị = tăng bản sao (A1-Alt2)',
      },
      // Thông tin dự kiến cho tài liệu mới
      nhan_de_du_kien: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      tac_gia_du_kien: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      isbn_du_kien: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      so_luong_dat: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      don_gia_du_kien: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      // A1 bước 5: đối chiếu thực nhận
      so_luong_da_nhan: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      // A1-Exc1: hàng thiếu/hỏng
      so_luong_loi: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
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

    await queryInterface.addIndex('chi_tiet_don_dat_hang', ['don_dat_hang_id'], {
      name: 'idx_ct_don_dat_hang',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chi_tiet_don_dat_hang');
  },
};
