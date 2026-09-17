'use strict';

// Thực thể BanSao — bản sao vật lý (A1, A2, A4, C3, C4, C7)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ban_sao', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_ban_sao: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã vạch/RFID dán trên bản sao vật lý — phải duy nhất trước khi cho mượn (A1 quy tắc)',
      },
      tai_lieu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tai_lieu', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vi_tri_ke: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Kho-Tầng-Kệ-Ngăn, VD: KA-T2-K05-N3',
      },
      // Vòng đời bản sao (mục 10 - State Machine)
      trang_thai: {
        type: Sequelize.ENUM(
          'cho_bien_muc',       // A1 → vừa nhập kho
          'cho_bo_sung_thong_tin', // A2-Exc1
          'san_sang',           // A2 → sẵn sàng cho mượn
          'dang_muon',          // C3
          'dat_truoc',          // C2 → đang giữ cho người đặt trước
          'mat',                // C7
          'hu_hong_cho_xu_ly',  // C7-Alt1
          'da_thanh_ly'         // A4 → kết thúc vòng đời
        ),
        defaultValue: 'cho_bien_muc',
        allowNull: false,
      },
      // D2: giá trị để tính bồi thường khi mất/hỏng
      gia_tri: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Giá trị bản sao (đơn giá bìa) dùng tính bồi thường D2',
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

    await queryInterface.addIndex('ban_sao', ['tai_lieu_id'], { name: 'idx_ban_sao_tai_lieu' });
    await queryInterface.addIndex('ban_sao', ['trang_thai'], { name: 'idx_ban_sao_trang_thai' });
    await queryInterface.addIndex('ban_sao', ['ma_ban_sao'], { name: 'idx_ban_sao_ma' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ban_sao');
  },
};
