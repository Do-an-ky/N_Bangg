'use strict';

// Bản sao vật lý cho từng đầu sách — mã vạch giả lập
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // tai_lieu_id → số lượng bản sao theo seed tài liệu
    // TL00001(id=1): 5 bản | TL00002(id=2): 4 bản | TL00003(id=3): 3 bản
    // TL00004(id=4): 3 bản | TL00005(id=5): 2 bản | TL00006(id=6): 8 bản
    // TL00007(id=7): 6 bản | TL00008(id=8): 2 bản | TL00009(id=9): 1 bản (chưa biên mục)

    const banSao = [];
    let counter = 1;

    const addCopies = (taiLieuId, count, status, prefix, basePrice) => {
      for (let i = 1; i <= count; i++) {
        banSao.push({
          ma_ban_sao: `BS${String(counter++).padStart(5, '0')}`,
          tai_lieu_id: taiLieuId,
          vi_tri_ke: status === 'san_sang' ? `KA-T${Math.ceil(taiLieuId / 3)}-K${String(taiLieuId).padStart(2,'0')}-N${i}` : null,
          trang_thai: status,
          gia_tri: basePrice,
          created_at: now,
          updated_at: now,
        });
      }
    };

    // TL00001 - Kỹ thuật lập trình: 3 sẵn sàng, 1 đang mượn, 1 đặt trước
    addCopies(1, 3, 'san_sang', 'KT', 85000);
    addCopies(1, 1, 'dang_muon', 'KT', 85000);
    addCopies(1, 1, 'dat_truoc', 'KT', 85000);

    // TL00002 - CSDL: 2 sẵn sàng, 2 đang mượn
    addCopies(2, 2, 'san_sang', 'DB', 90000);
    addCopies(2, 2, 'dang_muon', 'DB', 90000);

    // TL00003 - Tương tác người máy: 1 sẵn sàng, 2 đang mượn (test C2: tất cả đang mượn → phải đặt trước)
    addCopies(3, 1, 'san_sang', 'HCI', 95000);
    addCopies(3, 2, 'dang_muon', 'HCI', 95000);

    // TL00004 - Mạng máy tính: 2 sẵn sàng, 1 đang mượn
    addCopies(4, 2, 'san_sandy', 'NET', 120000);
    addCopies(4, 1, 'dang_muon', 'NET', 120000);
    // Fix: override the typo
    banSao[banSao.length - 3].trang_thai = 'san_sang';
    banSao[banSao.length - 2].trang_thai = 'san_sang';

    // TL00005 - Luận văn: 1 sẵn sàng, 1 đang mượn
    addCopies(5, 1, 'san_sang', 'LV', 0);
    addCopies(5, 1, 'dang_muon', 'LV', 0);

    // TL00006 - Giải tích 1: 6 sẵn sàng, 2 đang mượn
    addCopies(6, 6, 'san_sang', 'GT', 75000);
    addCopies(6, 2, 'dang_muon', 'GT', 75000);

    // TL00007 - Đại số tuyến tính: 5 sẵn sàng, 1 đã mất (test C7)
    addCopies(7, 5, 'san_sang', 'DS', 80000);
    addCopies(7, 1, 'mat', 'DS', 80000);

    // TL00008 - Clean Code: 2 sẵn sàng
    addCopies(8, 2, 'san_sang', 'CC', 350000);

    // TL00009 - Chưa biên mục: 1 bản đang chờ biên mục
    addCopies(9, 1, 'cho_bo_sung_thong_tin', 'NK', 0);

    await queryInterface.bulkInsert('ban_sao', banSao);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ban_sao', null, {});
  },
};
