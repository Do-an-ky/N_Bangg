'use strict';

// Seed phiếu mượn và phiếu phạt để kiểm thử các luồng C4-C7, D1-D3
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];

    // Ngày mượn 20 ngày trước (để test phiếu quá hạn)
    const ngayMuon20 = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0];
    // Ngày mượn 10 ngày trước (để test phiếu sắp hết hạn)
    const ngayMuon10 = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0];
    // Ngày hẹn trả đã qua (để test C6)
    const ngayHenTraQua = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0];
    // Ngày hẹn trả còn 2 ngày (để test C8 nhắc hạn)
    const ngayHenTraSom = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Phiếu mượn đang mượn bình thường — ban_doc_id=1, ban_sao_id cần khớp với seed ban_sao
    // Từ seed ban_sao: bản sao trạng thái 'dang_muon' là ban_sao id 4,5 (TL00001), 8,9 (TL00002), 11,12 (TL00003), 14 (TL00004), 16 (TL00005), 23,24 (TL00006), 30 (TL00007)
    // (thứ tự chính xác phụ thuộc ID tự tăng — trong thực tế cần query, nhưng ở đây seed theo thứ tự)
    // Để đơn giản và an toàn, seed phiếu mượn sử dụng sub-query trong thực tế
    // Tại đây dùng ID cố định phù hợp với thứ tự insert của seed ban_sao

    await queryInterface.bulkInsert('phieu_muon', [
      // Phiếu mượn bình thường — sắp đến hạn (còn 4 ngày) → test C8 nhắc hạn
      {
        ma_phieu_muon: 'PM2024001',
        ban_sao_id: 4,   // TL00001 bản sao 4 (dang_muon)
        ban_doc_id: 1,   // Nguyễn Thị Hương
        nhan_vien_id: 3, // Thủ thư
        ngay_muon: ngayMuon10,
        ngay_hen_tra: ngayHenTraSom,
        ngay_tra_thuc_te: null,
        so_lan_gia_han: 0,
        trang_thai: 'dang_muon',
        created_at: now,
        updated_at: now,
      },
      // Phiếu mượn QUÁN HẠN — test C6 (trả trễ)
      {
        ma_phieu_muon: 'PM2024002',
        ban_sao_id: 5,   // TL00001 bản sao 5 (dang_muon)
        ban_doc_id: 2,   // Trần Văn Minh
        nhan_vien_id: 3,
        ngay_muon: ngayMuon20,
        ngay_hen_tra: ngayHenTraQua,  // đã quá hạn 6 ngày
        ngay_tra_thuc_te: null,
        so_lan_gia_han: 0,
        trang_thai: 'dang_muon',
        created_at: now,
        updated_at: now,
      },
      // Phiếu mượn của bạn đọc có công nợ — test D3 và C3-Exc3
      {
        ma_phieu_muon: 'PM2023099',
        ban_sao_id: 8,   // TL00002 bản sao 1 (dang_muon)
        ban_doc_id: 6,   // Hoàng Văn Nợ Phạt
        nhan_vien_id: 3,
        ngay_muon: '2023-12-01',
        ngay_hen_tra: '2023-12-15',
        ngay_tra_thuc_te: '2024-01-05',  // đã trả nhưng trễ hạn
        so_lan_gia_han: 0,
        trang_thai: 'da_tra_tre_han',
        created_at: new Date('2023-12-01'),
        updated_at: new Date('2024-01-05'),
      },
      // Phiếu đang mượn của giảng viên — test định mức cao hơn
      {
        ma_phieu_muon: 'PM2024010',
        ban_sao_id: 9,   // TL00002
        ban_doc_id: 4,   // Giảng viên
        nhan_vien_id: 3,
        ngay_muon: ngayMuon10,
        ngay_hen_tra: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
        ngay_tra_thuc_te: null,
        so_lan_gia_han: 1,
        trang_thai: 'dang_muon',
        created_at: now,
        updated_at: now,
      },
    ]);

    // Phiếu phạt cho PM2023099 — bạn đọc BD2024006 chưa thanh toán (test D3, C3-Exc3)
    await queryInterface.bulkInsert('phieu_phat', [
      {
        ma_phieu_phat: 'PP2024001',
        phieu_muon_id: 3,    // PM2023099
        ban_doc_id: 6,       // Hoàng Văn Nợ Phạt
        loai_phat: 'tre_han',
        so_tien: 21000,      // 21 ngày × 1000đ/ngày
        so_ngay_tre: 21,
        trang_thai_thanh_toan: 'chua_thanh_toan',
        so_tien_mien_giam: 0,
        created_at: new Date('2024-01-05'),
        updated_at: new Date('2024-01-05'),
      },
    ]);

    // Đặt trước mẫu — TL00003 (Tương tác người máy) đang có 2 bản mượn, 1 sẵn sàng
    // Bạn đọc BD2024002 đặt trước để test C2
    await queryInterface.bulkInsert('dat_truoc', [
      {
        ma_dat_truoc: 'DT2024001',
        tai_lieu_id: 1,   // TL00001 - đang có người đặt trước (bản sao id 5 trạng thái dat_truoc)
        ban_doc_id: 2,    // Trần Văn Minh
        ban_sao_id: 5,    // Bản sao đã được giữ
        ngay_dat: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        vi_tri_hang_doi: 1,
        han_lay_sach: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        trang_thai: 'da_thong_bao',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('dat_truoc', null, {});
    await queryInterface.bulkDelete('phieu_phat', null, {});
    await queryInterface.bulkDelete('phieu_muon', null, {});
  },
};
