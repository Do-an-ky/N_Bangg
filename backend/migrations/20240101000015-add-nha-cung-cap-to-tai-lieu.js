'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm FK nhà cung cấp vào bảng tai_lieu
    await queryInterface.addColumn('tai_lieu', 'nha_cung_cap_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'nha_cung_cap', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tai_lieu', 'nha_cung_cap_id');
  },
};
