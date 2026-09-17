'use strict';

// Thực thể PhieuPhat — D1 Phạt trễ, D2 Bồi thường mất/hỏng, D3 Công nợ
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('phieu_phat', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_phieu_phat: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      phieu_muon_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'phieu_muon', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ban_doc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ban_doc', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Denormalized để truy vấn D3 nhanh hơn',
      },
      // D1, D2: loại phạt
      loai_phat: {
        type: Sequelize.ENUM('tre_han', 'mat_sach', 'hong_sach', 'phi_sua_chua'),
        allowNull: false,
      },
      // D1: Số tiền = số ngày trễ × mức phạt/ngày (E2), không vượt mức trần
      so_tien: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      so_ngay_tre: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Số ngày trễ, dùng cho loại tre_han',
      },
      // Vòng đời phiếu phạt (mục 10)
      trang_thai_thanh_toan: {
        type: Sequelize.ENUM('chua_thanh_toan', 'da_thanh_toan', 'da_mien_giam'),
        defaultValue: 'chua_thanh_toan',
        allowNull: false,
      },
      // D1-Exc1: Quản lý miễn giảm
      so_tien_mien_giam: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: true,
      },
      ly_do_mien_giam: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nhan_vien_duyet_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Quản lý duyệt miễn giảm (D1-Exc1)',
      },
      ngay_thanh_toan: {
        type: Sequelize.DATE,
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

    // D3: tổng công nợ theo bạn đọc
    await queryInterface.addIndex('phieu_phat', ['ban_doc_id', 'trang_thai_thanh_toan'], {
      name: 'idx_phieu_phat_cong_no',
    });
    await queryInterface.addIndex('phieu_phat', ['phieu_muon_id'], {
      name: 'idx_phieu_phat_phieu_muon',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('phieu_phat');
  },
};
