'use strict';

// A3 / Quy tắc #9: ghi log mọi thay đổi quan trọng
async function writeAuditLog(db, { loaiDoiTuong, doiTuongId, hanhDong, duLieuTruoc, duLieuSau, nhanVienId, banDocId, diaChi }) {
  try {
    await db.NhatKyThayDoi.create({
      loai_doi_tuong: loaiDoiTuong,
      doi_tuong_id: doiTuongId,
      hanh_dong: hanhDong,
      du_lieu_truoc: duLieuTruoc || null,
      du_lieu_sau: duLieuSau || null,
      nhan_vien_id: nhanVienId || null,
      ban_doc_id: banDocId || null,
      dia_chi_ip: diaChi || null,
    });
  } catch (err) {
    // Audit log failure must not break main transaction
    console.error('[AuditLog] Failed to write:', err.message);
  }
}

module.exports = { writeAuditLog };
