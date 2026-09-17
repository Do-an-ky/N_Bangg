'use strict';

// E2 - Cấu hình quy định thư viện
// Mỗi hàng = một hạng mục bạn đọc × loại tài liệu
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cau_hinh_quy_dinh', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // Kết hợp hang_muc_ban_doc + loai_tai_lieu tạo khóa duy nhất
      hang_muc_ban_doc: {
        type: Sequelize.ENUM('sinh_vien', 'giang_vien', 'nhan_vien', 'ngoai'),
        allowNull: false,
      },
      // 'mac_dinh' áp dụng khi loại tài liệu không có cấu hình riêng
      loai_tai_lieu: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'mac_dinh',
        comment: 'mac_dinh / sach / bao / tap_chi / luan_van',
      },
      // Quy tắc nghiệp vụ #1: số mượn tối đa theo hạng mục
      so_muon_toi_da: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      // Quy tắc nghiệp vụ #3: thời hạn mượn
      thoi_han_muon_ngay: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 14,
        comment: 'Số ngày mượn mặc định',
      },
      // Quy tắc nghiệp vụ #3: số lần gia hạn tối đa (C5)
      so_lan_gia_han_toi_da: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      // D1: mức phạt trễ hạn
      muc_phat_ngay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1000.00,
        comment: 'VNĐ/ngày trễ',
      },
      // D1: mức trần phạt (null = không giới hạn)
      muc_tran_phat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Tổng phạt tối đa; null = không giới hạn',
      },
      // C2-Exc1: thời gian giữ chỗ khi tài liệu sẵn sàng
      thoi_gian_giu_cho_ngay: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: 'Số ngày giữ sách cho người đặt trước trước khi hủy (C2-Exc1)',
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

    // Mỗi cặp (hạng mục, loại tài liệu) chỉ có một cấu hình
    await queryInterface.addIndex(
      'cau_hinh_quy_dinh',
      ['hang_muc_ban_doc', 'loai_tai_lieu'],
      { unique: true, name: 'idx_cau_hinh_unique' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cau_hinh_quy_dinh');
  },
};
