'use strict';

// Thực thể PhieuMuon — C3 Mượn, C4 Trả, C5 Gia hạn, C6 Trả trễ, C7 Mất/hỏng
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('phieu_muon', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_phieu_muon: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
        comment: 'Mã phiếu mượn duy nhất, VD: PM20240115001',
      },
      ban_sao_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ban_sao', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ban_doc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ban_doc', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Thủ thư xử lý giao dịch
      nhan_vien_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Thủ thư thực hiện giao dịch cho mượn',
      },
      ngay_muon: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ngay_hen_tra: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tính theo CauHinhQuyDinh.thoi_han_muon_ngay',
      },
      ngay_tra_thuc_te: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'null khi đang mượn; điền khi C4/C6/C7',
      },
      // C5: đếm số lần đã gia hạn để chặn khi vượt giới hạn (C5-Exc3)
      so_lan_gia_han: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      // Vòng đời phiếu mượn (mục 10)
      trang_thai: {
        type: Sequelize.ENUM(
          'dang_muon',
          'da_tra_dung_han',
          'da_tra_tre_han',
          'bao_mat',
          'bao_hong',
          'da_xu_ly_mat_hong'   // C7: sau khi hoàn tất nghĩa vụ bồi thường
        ),
        defaultValue: 'dang_muon',
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

    await queryInterface.addIndex('phieu_muon', ['ban_doc_id'], { name: 'idx_phieu_muon_ban_doc' });
    await queryInterface.addIndex('phieu_muon', ['ban_sao_id'], { name: 'idx_phieu_muon_ban_sao' });
    await queryInterface.addIndex('phieu_muon', ['trang_thai'], { name: 'idx_phieu_muon_trang_thai' });
    // Index hỗ trợ C8: quét phiếu sắp hết hạn/quá hạn
    await queryInterface.addIndex('phieu_muon', ['ngay_hen_tra', 'trang_thai'], {
      name: 'idx_phieu_muon_han_tra',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('phieu_muon');
  },
};
