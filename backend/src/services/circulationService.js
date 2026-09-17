'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundError, BusinessRuleError, ValidationError } = require('../utils/errors');
const { ERROR_CODES } = require('../utils/errors');
const { genLoanCode, genReservationCode, genFineCode } = require('../utils/codeGenerator');
const { writeAuditLog } = require('../utils/auditLog');
const { notifyUser } = require('../socket');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// E2: lấy cấu hình quy định theo hạng mục + loại tài liệu
async function getConfig(hangMucBanDoc, loaiTaiLieu) {
  let cfg = await db.CauHinhQuyDinh.findOne({
    where: { hang_muc_ban_doc: hangMucBanDoc, loai_tai_lieu: loaiTaiLieu },
  });
  if (!cfg) {
    cfg = await db.CauHinhQuyDinh.findOne({
      where: { hang_muc_ban_doc: hangMucBanDoc, loai_tai_lieu: 'mac_dinh' },
    });
  }
  if (!cfg) throw new Error(`Thiếu cấu hình quy định cho hạng mục ${hangMucBanDoc}`);
  return cfg;
}

// D1: tính tiền phạt trễ hạn
function calcFine(ngayHenTra, ngayTraThucTe, config) {
  const due = new Date(ngayHenTra);
  const ret = new Date(ngayTraThucTe);
  const diffMs = ret - due;
  if (diffMs <= 0) return { soNgayTre: 0, soTien: 0 };

  const soNgayTre = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let soTien = soNgayTre * parseFloat(config.muc_phat_ngay);
  if (config.muc_tran_phat) soTien = Math.min(soTien, parseFloat(config.muc_tran_phat));
  return { soNgayTre, soTien };
}

// D3: tổng công nợ chưa thanh toán
async function getTotalDebt(banDocId) {
  const result = await db.PhieuPhat.sum('so_tien', {
    where: { ban_doc_id: banDocId, trang_thai_thanh_toan: 'chua_thanh_toan' },
  });
  return result || 0;
}

// Validate thẻ bạn đọc (dùng cho C2, C3, C5)
async function validateCard(banDocId) {
  const member = await db.BanDoc.findByPk(banDocId);
  if (!member) throw new NotFoundError('Bạn đọc');

  if (member.trang_thai_the === 'bi_khoa')
    throw new BusinessRuleError(ERROR_CODES.CARD_LOCKED, 'CARD_LOCKED');
  if (member.trang_thai_the === 'da_huy')
    throw new BusinessRuleError(ERROR_CODES.CARD_CANCELLED, 'CARD_CANCELLED');
  if (member.trang_thai_the === 'het_han' || new Date(member.ngay_het_han) < new Date())
    throw new BusinessRuleError(ERROR_CODES.CARD_EXPIRED, 'CARD_EXPIRED');

  return member;
}

// C2/C4: xử lý hàng đợi đặt trước khi có bản sao được trả về
async function processReservationQueue(taiLieuId, banSaoId, transaction) {
  const next = await db.DatTruoc.findOne({
    where: { tai_lieu_id: taiLieuId, trang_thai: 'dang_cho' },
    order: [['vi_tri_hang_doi', 'ASC'], ['ngay_dat', 'ASC']],
    transaction,
  });

  if (!next) {
    // Hàng đợi rỗng → bản sao quay lại kệ
    await db.BanSao.update({ trang_thai: 'san_sang' }, { where: { id: banSaoId }, transaction });
    return null;
  }

  // Lấy cấu hình giữ chỗ
  const member = await db.BanDoc.findByPk(next.ban_doc_id, { transaction });
  const taiLieu = await db.TaiLieu.findByPk(taiLieuId, { transaction });
  const cfg = await getConfig(member.hang_muc, taiLieu.loai_tai_lieu);

  const hanLaySach = new Date();
  hanLaySach.setDate(hanLaySach.getDate() + cfg.thoi_gian_giu_cho_ngay);

  // Giữ bản sao cho người đứng đầu hàng đợi (C2 bước 3)
  await db.BanSao.update({ trang_thai: 'dat_truoc' }, { where: { id: banSaoId }, transaction });
  await next.update({
    ban_sao_id: banSaoId,
    trang_thai: 'da_thong_bao',
    han_lay_sach: hanLaySach.toISOString().split('T')[0],
    ngay_thong_bao: new Date(),
  }, { transaction });

  // C4 bước 5 / C2: Thông báo real-time cho bạn đọc qua Socket.io
  setImmediate(() => {
    notifyUser(next.ban_doc_id, 'reservation_ready', {
      type: 'reservation_ready',
      message: `Tài liệu "${taiLieu.nhan_de}" bạn đặt trước đã sẵn sàng. Vui lòng đến lấy trước ${hanLaySach.toISOString().split('T')[0]}.`,
      reservationId: next.id,
      taiLieuId,
      hanLaySach: hanLaySach.toISOString().split('T')[0],
    });
  });

  return next;
}

// ─── C1: TRA CỨU ─────────────────────────────────────────────────────────────
async function searchBooks({ q, theLoai, loaiTaiLieu, trangThai, page = 1, limit = 20 }) {
  const where = { trang_thai: { [Op.in]: ['hoat_dong'] } };
  if (trangThai) where.trang_thai = trangThai;
  if (loaiTaiLieu) where.loai_tai_lieu = loaiTaiLieu;
  if (theLoai) where.the_loai = theLoai;
  if (q) {
    where[Op.or] = [
      { nhan_de: { [Op.iLike]: `%${q}%` } },
      { tac_gia: { [Op.iLike]: `%${q}%` } },
      { isbn: { [Op.iLike]: `%${q}%` } },
      { tu_khoa: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const { count, rows } = await db.TaiLieu.findAndCountAll({
    where,
    include: [{
      model: db.BanSao, as: 'banSao',
      attributes: ['id', 'ma_ban_sao', 'vi_tri_ke', 'trang_thai'],
      where: { trang_thai: { [Op.ne]: 'da_thanh_ly' } },
      required: false,
    }],
    order: [['nhan_de', 'ASC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    distinct: true,
  });

  // Đếm bản sao sẵn sàng để hiển thị trạng thái (C1-Alt2 hint)
  const rowsWithAvail = rows.map(book => {
    const copies = book.banSao || [];
    const sanSang = copies.filter(c => c.trang_thai === 'san_sang').length;
    const dangMuon = copies.filter(c => c.trang_thai === 'dang_muon').length;
    return { ...book.toJSON(), sanSang, dangMuon, tongBanSao: copies.length };
  });

  return { count, rows: rowsWithAvail };
}

async function getBookDetail(taiLieuId) {
  const book = await db.TaiLieu.findByPk(taiLieuId, {
    include: [{
      model: db.BanSao, as: 'banSao',
      where: { trang_thai: { [Op.ne]: 'da_thanh_ly' } },
      required: false,
    }],
  });
  if (!book) throw new NotFoundError('Tài liệu');

  const queueCount = await db.DatTruoc.count({
    where: { tai_lieu_id: taiLieuId, trang_thai: 'dang_cho' },
  });

  return { ...book.toJSON(), soNguoiDatTruoc: queueCount };
}

// ─── C2: ĐẶT TRƯỚC ───────────────────────────────────────────────────────────
async function createReservation(banDocId, taiLieuId) {
  // C2: điều kiện tiên quyết — thẻ hợp lệ
  await validateCard(banDocId);

  const book = await db.TaiLieu.findByPk(taiLieuId);
  if (!book || book.trang_thai !== 'hoat_dong') throw new NotFoundError('Tài liệu');

  // Kiểm tra bạn đọc chưa đặt trước tài liệu này
  const alreadyReserved = await db.DatTruoc.findOne({
    where: { tai_lieu_id: taiLieuId, ban_doc_id: banDocId, trang_thai: { [Op.in]: ['dang_cho', 'da_thong_bao'] } },
  });
  if (alreadyReserved) throw new BusinessRuleError(ERROR_CODES.ALREADY_RESERVED, 'ALREADY_RESERVED');

  // Lấy vị trí tiếp theo trong hàng đợi (FIFO)
  const maxPos = await db.DatTruoc.max('vi_tri_hang_doi', {
    where: { tai_lieu_id: taiLieuId, trang_thai: { [Op.in]: ['dang_cho', 'da_thong_bao'] } },
  });

  const reservation = await db.DatTruoc.create({
    ma_dat_truoc: genReservationCode(),
    tai_lieu_id: taiLieuId,
    ban_doc_id: banDocId,
    vi_tri_hang_doi: (maxPos || 0) + 1,
    trang_thai: 'dang_cho',
  });

  return reservation;
}

// C2-Alt1: Bạn đọc hủy đặt trước
async function cancelReservation(datTruocId, banDocId) {
  const res = await db.DatTruoc.findOne({ where: { id: datTruocId, ban_doc_id: banDocId } });
  if (!res) throw new NotFoundError('Yêu cầu đặt trước');
  if (!['dang_cho', 'da_thong_bao'].includes(res.trang_thai))
    throw new BusinessRuleError('Không thể hủy yêu cầu đặt trước ở trạng thái này');

  const t = await db.sequelize.transaction();
  try {
    // Nếu đã giữ bản sao → trả lại kệ hoặc chuyển cho người kế tiếp
    if (res.ban_sao_id) {
      await processReservationQueue(res.tai_lieu_id, res.ban_sao_id, t);
    }
    await res.update({ trang_thai: 'da_huy_ban_doc', ban_sao_id: null }, { transaction: t });

    // Cập nhật lại vị trí hàng đợi cho những người phía sau
    await db.DatTruoc.decrement('vi_tri_hang_doi', {
      where: { tai_lieu_id: res.tai_lieu_id, trang_thai: 'dang_cho', vi_tri_hang_doi: { [Op.gt]: res.vi_tri_hang_doi } },
      transaction: t,
    });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return res;
}

// ─── C3: MƯỢN TÀI LIỆU (CHECK-OUT) ──────────────────────────────────────────
async function checkoutBook(banDocId, maBanSao, nhanVienId, ip) {
  // Validate card
  const member = await validateCard(banDocId);

  // Tìm bản sao bằng mã vạch
  const copy = await db.BanSao.findOne({ where: { ma_ban_sao: maBanSao }, include: [{ model: db.TaiLieu, as: 'taiLieu' }] });
  if (!copy) throw new NotFoundError('Bản sao tài liệu');

  // C3-Exc4: bản sao không ở trạng thái hợp lệ
  if (copy.trang_thai !== 'san_sang' && copy.trang_thai !== 'dat_truoc')
    throw new BusinessRuleError(ERROR_CODES.COPY_NOT_AVAILABLE, 'COPY_NOT_AVAILABLE');

  // Nếu bản sao đang được giữ (dat_truoc), phải là cho chính bạn đọc này
  if (copy.trang_thai === 'dat_truoc') {
    const reservedForMe = await db.DatTruoc.findOne({
      where: { ban_sao_id: copy.id, ban_doc_id: banDocId, trang_thai: 'da_thong_bao' },
    });
    if (!reservedForMe)
      throw new BusinessRuleError(ERROR_CODES.COPY_RESERVED_BY_OTHER, 'COPY_RESERVED_BY_OTHER');
  }

  // Lấy cấu hình quy định
  const cfg = await getConfig(member.hang_muc, copy.taiLieu.loai_tai_lieu);

  // C3-Exc2: vượt số lượng mượn tối đa
  const activeLoans = await db.PhieuMuon.count({ where: { ban_doc_id: banDocId, trang_thai: 'dang_muon' } });
  if (activeLoans >= cfg.so_muon_toi_da)
    throw new BusinessRuleError(
      `${ERROR_CODES.LOAN_MAX_EXCEEDED} (đang mượn: ${activeLoans}/${cfg.so_muon_toi_da})`,
      'LOAN_MAX_EXCEEDED'
    );

  // C3-Exc3: còn công nợ/phạt chưa thanh toán (D3)
  const debt = await getTotalDebt(banDocId);
  if (debt > 0)
    throw new BusinessRuleError(`${ERROR_CODES.HAS_UNPAID_DEBT} (công nợ: ${debt.toLocaleString('vi-VN')} VNĐ)`, 'HAS_UNPAID_DEBT');

  // Tính ngày hẹn trả
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + cfg.thoi_han_muon_ngay);
  const ngayHenTra = dueDate.toISOString().split('T')[0];

  const t = await db.sequelize.transaction();
  try {
    const loan = await db.PhieuMuon.create({
      ma_phieu_muon: genLoanCode(),
      ban_sao_id: copy.id,
      ban_doc_id: banDocId,
      nhan_vien_id: nhanVienId || null,
      ngay_muon: today,
      ngay_hen_tra: ngayHenTra,
      so_lan_gia_han: 0,
      trang_thai: 'dang_muon',
    }, { transaction: t });

    // Cập nhật trạng thái bản sao → đang mượn
    await copy.update({ trang_thai: 'dang_muon' }, { transaction: t });

    // Nếu bản sao từ đặt trước → đóng phiếu đặt trước
    if (copy.trang_thai === 'dat_truoc') {
      await db.DatTruoc.update(
        { trang_thai: 'da_muon' },
        { where: { ban_sao_id: copy.id, ban_doc_id: banDocId, trang_thai: 'da_thong_bao' }, transaction: t }
      );
    }

    await writeAuditLog(db, {
      loaiDoiTuong: 'phieu_muon', doiTuongId: loan.id, hanhDong: 'tao_moi',
      duLieuSau: { maBanSao, banDocId, ngayHenTra }, nhanVienId, diaChi: ip,
    });

    await t.commit();
    return { loan, copy, ngayHenTra };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

// ─── C4: TRẢ TÀI LIỆU ────────────────────────────────────────────────────────
async function returnBook(maBanSao, nhanVienId, tinhTrang = 'ok', ip) {
  const copy = await db.BanSao.findOne({
    where: { ma_ban_sao: maBanSao },
    include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['id', 'loai_tai_lieu'] }],
  });
  if (!copy) throw new NotFoundError('Bản sao tài liệu');

  const loan = await db.PhieuMuon.findOne({
    where: { ban_sao_id: copy.id, trang_thai: 'dang_muon' },
    include: [{ model: db.BanDoc, as: 'banDoc' }],
  });
  if (!loan) throw new NotFoundError('Phiếu mượn đang hoạt động');

  // C4-Exc2: Tài liệu hư hỏng → chuyển C7
  if (tinhTrang === 'hong') return reportLostDamaged(loan.id, 'bao_hong', nhanVienId, ip);

  const today = new Date().toISOString().split('T')[0];
  const isLate = today > loan.ngay_hen_tra;

  const t = await db.sequelize.transaction();
  try {
    let fine = null;

    if (isLate) {
      // C6: Trả trễ hạn — tính phạt D1
      const member = loan.banDoc;
      const cfg = await getConfig(member.hang_muc, copy.taiLieu.loai_tai_lieu);
      const { soNgayTre, soTien } = calcFine(loan.ngay_hen_tra, today, cfg);

      if (soTien > 0) {
        fine = await db.PhieuPhat.create({
          ma_phieu_phat: genFineCode(),
          phieu_muon_id: loan.id,
          ban_doc_id: loan.ban_doc_id,
          loai_phat: 'tre_han',
          so_tien: soTien,
          so_ngay_tre: soNgayTre,
          trang_thai_thanh_toan: 'chua_thanh_toan',
        }, { transaction: t });
      }

      await loan.update({ trang_thai: 'da_tra_tre_han', ngay_tra_thuc_te: today }, { transaction: t });
    } else {
      await loan.update({ trang_thai: 'da_tra_dung_han', ngay_tra_thuc_te: today }, { transaction: t });
    }

    // C4 bước 5: kiểm tra hàng đợi đặt trước
    const nextReservation = await processReservationQueue(copy.taiLieu.id, copy.id, t);

    await writeAuditLog(db, {
      loaiDoiTuong: 'phieu_muon', doiTuongId: loan.id, hanhDong: 'cap_nhat',
      duLieuSau: { trangThai: isLate ? 'da_tra_tre_han' : 'da_tra_dung_han', ngayTraThucTe: today },
      nhanVienId, diaChi: ip,
    });

    await t.commit();
    return { loan, fine, nextReservation, isLate };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

// ─── C5: GIA HẠN THỜI GIAN MƯỢN ─────────────────────────────────────────────
async function renewLoan(phieuMuonId, requesterId, isStaff = false) {
  const loan = await db.PhieuMuon.findOne({
    where: { id: phieuMuonId, trang_thai: 'dang_muon' },
    include: [
      { model: db.BanDoc, as: 'banDoc' },
      { model: db.BanSao, as: 'banSao', include: [{ model: db.TaiLieu, as: 'taiLieu' }] },
    ],
  });
  if (!loan) throw new NotFoundError('Phiếu mượn');

  // Chỉ bạn đọc sở hữu hoặc nhân viên được gia hạn
  if (!isStaff && loan.ban_doc_id !== requesterId)
    throw new BusinessRuleError('Không có quyền gia hạn phiếu mượn này');

  const today = new Date().toISOString().split('T')[0];

  // C5-Exc1: đã quá hạn
  if (today > loan.ngay_hen_tra)
    throw new BusinessRuleError(ERROR_CODES.LOAN_OVERDUE, 'LOAN_OVERDUE');

  // C5-Exc2: có người đặt trước tài liệu này
  const hasQueue = await db.DatTruoc.count({
    where: { tai_lieu_id: loan.banSao.taiLieu.id, trang_thai: { [Op.in]: ['dang_cho', 'da_thong_bao'] } },
  });
  if (hasQueue > 0)
    throw new BusinessRuleError(ERROR_CODES.RENEW_HAS_RESERVATION, 'RENEW_HAS_RESERVATION');

  // C5-Exc3: đã hết lần gia hạn
  const cfg = await getConfig(loan.banDoc.hang_muc, loan.banSao.taiLieu.loai_tai_lieu);
  if (loan.so_lan_gia_han >= cfg.so_lan_gia_han_toi_da)
    throw new BusinessRuleError(
      `${ERROR_CODES.RENEW_MAX_EXCEEDED} (đã gia hạn: ${loan.so_lan_gia_han}/${cfg.so_lan_gia_han_toi_da} lần)`,
      'RENEW_MAX_EXCEEDED'
    );

  // Tính ngày hẹn trả mới
  const newDue = new Date(loan.ngay_hen_tra);
  newDue.setDate(newDue.getDate() + cfg.thoi_han_muon_ngay);
  const newDueStr = newDue.toISOString().split('T')[0];

  await loan.update({ ngay_hen_tra: newDueStr, so_lan_gia_han: loan.so_lan_gia_han + 1 });
  return loan;
}

// ─── C7: XỬ LÝ MẤT / HƯ HỎNG ────────────────────────────────────────────────
async function reportLostDamaged(phieuMuonId, loai, nhanVienId, ip) {
  const loan = await db.PhieuMuon.findOne({
    where: { id: phieuMuonId, trang_thai: 'dang_muon' },
    include: [
      { model: db.BanDoc, as: 'banDoc' },
      { model: db.BanSao, as: 'banSao', include: [{ model: db.TaiLieu, as: 'taiLieu' }] },
    ],
  });
  if (!loan) throw new NotFoundError('Phiếu mượn đang hoạt động');

  const copy = loan.banSao;
  const compensationAmount = parseFloat(copy.gia_tri) || 0;

  const t = await db.sequelize.transaction();
  try {
    // Cập nhật trạng thái phiếu mượn
    await loan.update({ trang_thai: loai }, { transaction: t });

    // Cập nhật trạng thái bản sao
    const copyStatus = loai === 'bao_mat' ? 'mat' : 'hu_hong_cho_xu_ly';
    await copy.update({ trang_thai: copyStatus }, { transaction: t });

    // Tạo phiếu phạt bồi thường (D2)
    let fine = null;
    if (compensationAmount > 0) {
      fine = await db.PhieuPhat.create({
        ma_phieu_phat: genFineCode(),
        phieu_muon_id: loan.id,
        ban_doc_id: loan.ban_doc_id,
        loai_phat: loai === 'bao_mat' ? 'mat_sach' : 'hong_sach',
        so_tien: compensationAmount,
        trang_thai_thanh_toan: 'chua_thanh_toan',
      }, { transaction: t });
    }

    await writeAuditLog(db, {
      loaiDoiTuong: 'phieu_muon', doiTuongId: loan.id, hanhDong: 'cap_nhat',
      duLieuSau: { trangThai: loai, loaiPhat: loai }, nhanVienId, diaChi: ip,
    });

    await t.commit();
    return { loan, fine, compensationAmount };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

// Hoàn tất nghĩa vụ bồi thường → đóng phiếu mượn (C7 bước 5)
async function completeLostDamaged(phieuMuonId, nhanVienId, ip) {
  const loan = await db.PhieuMuon.findByPk(phieuMuonId);
  if (!loan || !['bao_mat', 'bao_hong'].includes(loan.trang_thai))
    throw new NotFoundError('Phiếu mượn đang chờ xử lý mất/hỏng');

  await loan.update({ trang_thai: 'da_xu_ly_mat_hong', ngay_tra_thuc_te: new Date().toISOString().split('T')[0] });
  return loan;
}

// ─── LOAN QUERIES ─────────────────────────────────────────────────────────────

// C5/C7 staff view: danh sách tất cả phiếu mượn
async function listLoans({ search, trangThai, page = 1, limit = 20 } = {}) {
  const where = {};
  if (trangThai === 'qua_han') {
    where.trang_thai = 'dang_muon';
    where.ngay_hen_tra = { [Op.lt]: new Date() };
  } else if (trangThai) {
    where.trang_thai = trangThai;
  }

  const memberWhere = search ? {
    [Op.or]: [
      { ho_ten: { [Op.iLike]: `%${search}%` } },
      { ma_the: { [Op.iLike]: `%${search}%` } },
    ],
  } : undefined;

  const offset = (page - 1) * limit;
  const { rows, count } = await db.PhieuMuon.findAndCountAll({
    where,
    include: [
      {
        model: db.BanDoc, as: 'banDoc',
        attributes: ['id', 'ma_the', 'ho_ten'],
        where: memberWhere,
        required: !!search,
      },
      {
        model: db.BanSao, as: 'banSao',
        attributes: ['id', 'ma_ban_sao'],
        include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de'] }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return { rows, total: count };
}

async function getLoansByMember(banDocId, trangThai) {
  const where = { ban_doc_id: banDocId };
  if (trangThai) where.trang_thai = trangThai;
  return db.PhieuMuon.findAll({
    where,
    include: [{
      model: db.BanSao, as: 'banSao',
      include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['id', 'ma_tai_lieu', 'nhan_de', 'tac_gia'] }],
    }],
    order: [['created_at', 'DESC']],
  });
}

async function getLoanDetail(phieuMuonId) {
  const loan = await db.PhieuMuon.findByPk(phieuMuonId, {
    include: [
      { model: db.BanSao, as: 'banSao', include: [{ model: db.TaiLieu, as: 'taiLieu' }] },
      { model: db.BanDoc, as: 'banDoc', attributes: ['id', 'ma_the', 'ho_ten', 'hang_muc'] },
      { model: db.PhieuPhat, as: 'phieuPhat' },
    ],
  });
  if (!loan) throw new NotFoundError('Phiếu mượn');
  return loan;
}

async function getReservationsByMember(banDocId) {
  return db.DatTruoc.findAll({
    where: { ban_doc_id: banDocId, trang_thai: { [Op.in]: ['dang_cho', 'da_thong_bao'] } },
    include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['id', 'nhan_de', 'tac_gia', 'bia_sach_url'] }],
    order: [['ngay_dat', 'DESC']],
  });
}

// D1-Exc1: Quản lý miễn giảm phạt
async function waiveFine(phieuPhatId, soTienMienGiam, lyDo, nhanVienId) {
  const fine = await db.PhieuPhat.findByPk(phieuPhatId);
  if (!fine) throw new NotFoundError('Phiếu phạt');
  if (fine.trang_thai_thanh_toan !== 'chua_thanh_toan')
    throw new BusinessRuleError('Phiếu phạt đã được xử lý');

  const remainAmount = parseFloat(fine.so_tien) - parseFloat(soTienMienGiam);
  const newStatus = remainAmount <= 0 ? 'da_mien_giam' : 'chua_thanh_toan';

  await fine.update({
    so_tien_mien_giam: soTienMienGiam,
    ly_do_mien_giam: lyDo,
    nhan_vien_duyet_id: nhanVienId,
    trang_thai_thanh_toan: newStatus,
    so_tien: Math.max(0, remainAmount),
  });
  return fine;
}

// D1: Thu tiền phạt
async function payFine(phieuPhatId, nhanVienId) {
  const fine = await db.PhieuPhat.findByPk(phieuPhatId);
  if (!fine) throw new NotFoundError('Phiếu phạt');
  if (fine.trang_thai_thanh_toan !== 'chua_thanh_toan')
    throw new BusinessRuleError('Phiếu phạt này đã được thanh toán hoặc miễn giảm');

  await fine.update({
    trang_thai_thanh_toan: 'da_thanh_toan',
    ngay_thanh_toan: new Date(),
    nhan_vien_duyet_id: nhanVienId,
  });

  // Nếu phiếu mượn liên quan là bao_mat/bao_hong → hoàn tất
  const loan = await db.PhieuMuon.findByPk(fine.phieu_muon_id);
  if (loan && ['bao_mat', 'bao_hong'].includes(loan.trang_thai)) {
    const remaining = await db.PhieuPhat.count({
      where: { phieu_muon_id: loan.id, trang_thai_thanh_toan: 'chua_thanh_toan' },
    });
    if (remaining === 0) await loan.update({ trang_thai: 'da_xu_ly_mat_hong' });
  }

  return fine;
}

module.exports = {
  searchBooks, getBookDetail,
  createReservation, cancelReservation,
  checkoutBook, returnBook, renewLoan,
  reportLostDamaged, completeLostDamaged,
  listLoans, getLoansByMember, getLoanDetail, getReservationsByMember,
  waiveFine, payFine, getTotalDebt,
};
