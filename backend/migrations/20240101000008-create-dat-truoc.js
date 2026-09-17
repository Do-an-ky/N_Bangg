'use strict';

// Thực thể DatTruoc — C2 Đặt trước (Reservation), hàng đợi FIFO
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dat_truoc', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_dat_truoc: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      tai_lieu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tai_lieu', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Đặt trước đầu sách, không phải bản sao cụ thể',
      },
      ban_doc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ban_doc', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // C2: bản sao được giữ khi có người trả (C4 → C2)
      ban_sao_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ban_sao', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Điền khi hệ thống giữ bản sao cụ thể cho người đặt',
      },
      ngay_dat: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      // Quy tắc #5: FIFO — vị trí trong hàng đợi
      vi_tri_hang_doi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      // C2-Exc1: hạn giữ chỗ sau khi thông báo sẵn sàng
      han_lay_sach: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Hạn đến nhận; null khi chưa thông báo. Quá hạn → tự động hủy (C2-Exc1)',
      },
      trang_thai: {
        type: Sequelize.ENUM(
          'dang_cho',         // C2: đang trong hàng đợi
          'da_thong_bao',     // C2 bước 4: đã gửi thông báo sẵn sàng
          'da_muon',          // C3: đã chuyển sang phiếu mượn
          'da_huy_ban_doc',   // C2-Alt1: bạn đọc tự hủy
          'da_huy_het_han'    // C2-Exc1: hết hạn giữ chỗ tự động
        ),
        defaultValue: 'dang_cho',
        allowNull: false,
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

    await queryInterface.addIndex('dat_truoc', ['tai_lieu_id', 'trang_thai'], {
      name: 'idx_dat_truoc_tai_lieu_trang_thai',
    });
    await queryInterface.addIndex('dat_truoc', ['ban_doc_id'], { name: 'idx_dat_truoc_ban_doc' });
    // FIFO query: lấy người đứng đầu hàng đợi
    await queryInterface.addIndex('dat_truoc', ['tai_lieu_id', 'trang_thai', 'vi_tri_hang_doi'], {
      name: 'idx_dat_truoc_fifo',
    });
    // Cron job C2-Exc1: tìm giữ chỗ quá hạn
    await queryInterface.addIndex('dat_truoc', ['trang_thai', 'han_lay_sach'], {
      name: 'idx_dat_truoc_het_han',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dat_truoc');
  },
};
