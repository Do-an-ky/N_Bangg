'use strict';

// A1 - Bổ sung tài liệu: Đơn đặt hàng gửi nhà cung cấp
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('don_dat_hang', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_don: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      nha_cung_cap_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'nha_cung_cap', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nhan_vien_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Thủ thư lập đơn (A1 bước 3)',
      },
      nguoi_duyet_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Quản lý phê duyệt (A1 bước 2–3)',
      },
      ngay_lap: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      ngay_du_kien_giao: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      ngay_duyet: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // A1-Alt1: quản lý từ chối → quay lại cho thủ thư điều chỉnh
      trang_thai: {
        type: Sequelize.ENUM(
          'cho_duyet',      // A1 bước 2
          'da_duyet',       // A1 bước 3
          'tu_choi',        // A1-Alt1
          'da_dat_hang',    // gửi nhà cung cấp
          'da_nhan_mot_phan', // A1-Exc1 hàng thiếu
          'hoan_thanh',     // A1 bước 6
          'da_huy'
        ),
        defaultValue: 'cho_duyet',
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

    await queryInterface.addIndex('don_dat_hang', ['trang_thai'], { name: 'idx_don_dat_hang_trang_thai' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('don_dat_hang');
  },
};
