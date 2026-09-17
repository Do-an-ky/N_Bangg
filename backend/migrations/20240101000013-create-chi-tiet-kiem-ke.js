'use strict';

// A5 - Kiểm kê: chi tiết từng bản sao được quét
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chi_tiet_kiem_ke', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      kiem_ke_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'kiem_ke', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ban_sao_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ban_sao', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      trang_thai_he_thong: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'Trạng thái trong DB tại thời điểm kiểm kê',
      },
      // A5 bước 3: ghi nhận chênh lệch
      trang_thai_thuc_te: {
        type: Sequelize.ENUM('co_mat', 'thieu', 'sai_vi_tri', 'hu_hong'),
        allowNull: false,
        defaultValue: 'co_mat',
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

    await queryInterface.addIndex('chi_tiet_kiem_ke', ['kiem_ke_id'], { name: 'idx_ct_kiem_ke' });
    await queryInterface.addIndex('chi_tiet_kiem_ke', ['ban_sao_id'], { name: 'idx_ct_kiem_ke_ban_sao' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chi_tiet_kiem_ke');
  },
};
