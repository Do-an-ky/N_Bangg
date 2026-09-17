'use strict';
const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const { notifyUser } = require('../socket');

// C8: Nhắc nhở trả sách trước hạn
async function sendDueReminders() {
  const reminderDays = parseInt(process.env.REMINDER_DAYS_BEFORE || '2');
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + reminderDays);
  const dateStr = targetDate.toISOString().split('T')[0];

  const loans = await db.PhieuMuon.findAll({
    where: {
      trang_thai: 'dang_muon',
      ngay_hen_tra: dateStr,
    },
    include: [
      { model: db.BanDoc, as: 'banDoc', attributes: ['id', 'ho_ten', 'email'] },
      { model: db.BanSao, as: 'banSao', include: [{ model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de'] }] },
    ],
  });

  for (const loan of loans) {
    notifyUser(loan.ban_doc_id, 'due_reminder', {
      type: 'due_reminder',
      message: `Tài liệu "${loan.banSao?.taiLieu?.nhan_de}" sẽ đến hạn trả vào ngày ${loan.ngay_hen_tra}.`,
      loanId: loan.id,
      ngayHenTra: loan.ngay_hen_tra,
    });
  }

  if (loans.length > 0) {
    console.log(`[Cron C8] Đã gửi ${loans.length} nhắc nhở trả sách (hạn ${dateStr})`);
  }
}

// C2-Exc1: Hủy đặt trước quá hạn thông báo (sau 3 ngày không đến lấy)
async function expireStaleReservations() {
  const HOLD_DAYS = parseInt(process.env.RESERVATION_HOLD_DAYS || '3');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HOLD_DAYS);

  const stale = await db.DatTruoc.findAll({
    where: {
      trang_thai: 'da_thong_bao',
      ngay_thong_bao: { [Op.lte]: cutoff },
    },
    include: [
      { model: db.BanDoc, as: 'banDoc', attributes: ['id', 'ho_ten'] },
      { model: db.TaiLieu, as: 'taiLieu', attributes: ['nhan_de'] },
    ],
  });

  for (const res of stale) {
    await res.update({ trang_thai: 'da_huy', ghi_chu: `Tự động hủy: không đến lấy sau ${HOLD_DAYS} ngày thông báo` });

    // Giải phóng bản sao đang giữ nếu có
    if (res.ban_sao_id) {
      await db.BanSao.update(
        { trang_thai: 'san_sang' },
        { where: { id: res.ban_sao_id, trang_thai: 'dat_truoc' } },
      );
    }

    notifyUser(res.ban_doc_id, 'reservation_expired', {
      type: 'reservation_expired',
      message: `Đặt trước tài liệu "${res.taiLieu?.nhan_de}" đã bị hủy do không đến lấy sau ${HOLD_DAYS} ngày.`,
      reservationId: res.id,
    });
  }

  if (stale.length > 0) {
    console.log(`[Cron C2] Đã hủy ${stale.length} đặt trước quá hạn thông báo`);
  }
}

function startCronJobs() {
  const reminderSchedule = process.env.CRON_REMINDER_SCHEDULE || '0 7 * * *';

  // C8: Nhắc nhở mỗi ngày theo lịch
  cron.schedule(reminderSchedule, () => {
    console.log('[Cron] Chạy nhắc nhở trả sách...');
    sendDueReminders().catch((err) => console.error('[Cron C8] Error:', err.message));
  });

  // C2-Exc1: Kiểm tra đặt trước hết hạn mỗi ngày lúc 8:00
  cron.schedule('0 8 * * *', () => {
    console.log('[Cron] Kiểm tra đặt trước hết hạn...');
    expireStaleReservations().catch((err) => console.error('[Cron C2] Error:', err.message));
  });

  console.log('[Cron] Các tác vụ định kỳ đã khởi động');
}

module.exports = { startCronJobs, sendDueReminders, expireStaleReservations };
