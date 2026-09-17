'use strict';

// A3 - Quy tắc #9: ghi log lịch sử thay đổi dữ liệu tài liệu/bạn đọc
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nhat_ky_thay_doi', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // Đối tượng bị thay đổi
      loai_doi_tuong: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'tai_lieu / ban_sao / ban_doc / phieu_muon / phieu_phat / cau_hinh / ...',
      },
      doi_tuong_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hanh_dong: {
        type: Sequelize.ENUM('tao_moi', 'cap_nhat', 'xoa', 'khoa', 'mo_khoa', 'duyet', 'tu_choi'),
        allowNull: false,
      },
      // A3: lưu giá trị trước/sau để truy vết
      du_lieu_truoc: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      du_lieu_sau: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      // Người thực hiện (nhân viên hoặc bạn đọc)
      nhan_vien_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'nhan_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ban_doc_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ban_doc', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      dia_chi_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
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
    });

    await queryInterface.addIndex('nhat_ky_thay_doi', ['loai_doi_tuong', 'doi_tuong_id'], {
      name: 'idx_audit_doi_tuong',
    });
    await queryInterface.addIndex('nhat_ky_thay_doi', ['nhan_vien_id'], {
      name: 'idx_audit_nhan_vien',
    });
    await queryInterface.addIndex('nhat_ky_thay_doi', ['created_at'], {
      name: 'idx_audit_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('nhat_ky_thay_doi');
  },
};
