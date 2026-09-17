'use strict';

// E2 - Cấu hình quy định theo hạng mục bạn đọc
// Đây là bộ tham số mặc định — Admin có thể thay đổi qua giao diện
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const configs = [];

    // Mỗi hạng mục × loại tài liệu 'mac_dinh' (áp dụng cho tất cả loại tài liệu
    // trừ khi có cấu hình riêng cho loại đó)
    const hangMucs = ['sinh_vien', 'giang_vien', 'nhan_vien', 'ngoai'];

    const defaults = {
      sinh_vien: {
        so_muon_toi_da: 5,
        thoi_han_muon_ngay: 14,
        so_lan_gia_han_toi_da: 2,
        muc_phat_ngay: 1000,
        muc_tran_phat: 50000,
        thoi_gian_giu_cho_ngay: 3,
      },
      giang_vien: {
        so_muon_toi_da: 10,
        thoi_han_muon_ngay: 30,
        so_lan_gia_han_toi_da: 3,
        muc_phat_ngay: 1000,
        muc_tran_phat: 100000,
        thoi_gian_giu_cho_ngay: 5,
      },
      nhan_vien: {
        so_muon_toi_da: 7,
        thoi_han_muon_ngay: 21,
        so_lan_gia_han_toi_da: 2,
        muc_phat_ngay: 1000,
        muc_tran_phat: 70000,
        thoi_gian_giu_cho_ngay: 3,
      },
      ngoai: {
        so_muon_toi_da: 3,
        thoi_han_muon_ngay: 7,
        so_lan_gia_han_toi_da: 1,
        muc_phat_ngay: 2000,
        muc_tran_phat: 30000,
        thoi_gian_giu_cho_ngay: 2,
      },
    };

    for (const hm of hangMucs) {
      configs.push({
        hang_muc_ban_doc: hm,
        loai_tai_lieu: 'mac_dinh',
        ...defaults[hm],
        created_at: now,
        updated_at: now,
      });
    }

    // Cấu hình riêng cho luận văn (thường có thời hạn ngắn hơn và không gia hạn được)
    configs.push({
      hang_muc_ban_doc: 'sinh_vien',
      loai_tai_lieu: 'luan_van',
      so_muon_toi_da: 2,
      thoi_han_muon_ngay: 7,
      so_lan_gia_han_toi_da: 0,
      muc_phat_ngay: 2000,
      muc_tran_phat: 30000,
      thoi_gian_giu_cho_ngay: 2,
      created_at: now,
      updated_at: now,
    });

    configs.push({
      hang_muc_ban_doc: 'giang_vien',
      loai_tai_lieu: 'luan_van',
      so_muon_toi_da: 3,
      thoi_han_muon_ngay: 14,
      so_lan_gia_han_toi_da: 1,
      muc_phat_ngay: 2000,
      muc_tran_phat: 50000,
      thoi_gian_giu_cho_ngay: 3,
      created_at: now,
      updated_at: now,
    });

    await queryInterface.bulkInsert('cau_hinh_quy_dinh', configs);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cau_hinh_quy_dinh', null, {});
  },
};
