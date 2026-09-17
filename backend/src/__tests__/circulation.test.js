'use strict';
require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../models');

// ── Token helpers ──────────────────────────────────────────────────────────────
function staffToken(overrides = {}) {
  return jwt.sign({ id: 999, role: 'thu_thu', userType: 'staff', hoTen: 'Test Staff', ...overrides }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
function memberToken(id) {
  return jwt.sign({ id, role: 'ban_doc', userType: 'member', hoTen: 'Test Member' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Data helpers ───────────────────────────────────────────────────────────────
async function createDoc() {
  return db.TaiLieu.create({
    ma_tai_lieu: `TL_TEST_${Date.now()}`,
    nhan_de: 'Test Book',
    tac_gia: 'Test Author',
    loai_tai_lieu: 'sach',
    trang_thai: 'hoat_dong',
  });
}

async function createCopy(taiLieuId, trangThai = 'san_sang') {
  return db.BanSao.create({
    ma_ban_sao: `BS_TEST_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    tai_lieu_id: taiLieuId,
    trang_thai: trangThai,
  });
}

async function createMember(hangMuc = 'sinh_vien') {
  const hash = await bcrypt.hash('Test@123', 10);
  return db.BanDoc.create({
    ma_the: `BD_T_${Date.now()}`,
    ho_ten: 'Test Member',
    email: `m_${Date.now()}@test.com`,
    so_cmnd: String(Date.now()).slice(0, 12),
    hang_muc: hangMuc,
    trang_thai_the: 'hoat_dong',
    ngay_dang_ky: new Date().toISOString().split('T')[0],
    ngay_het_han: '2099-12-31',
    password_hash: hash,
  });
}

// ── C1: Tra cứu ──────────────────────────────────────────────────────────────
describe('C1 — Tra cứu tài liệu', () => {
  let doc;
  beforeAll(async () => { doc = await createDoc(); });
  afterAll(async () => { await db.TaiLieu.destroy({ where: { id: doc.id } }); });

  test('Tìm kiếm không cần đăng nhập', async () => {
    const res = await request(app).get('/api/v1/circulation/books').query({ q: 'Test Book' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Xem chi tiết tài liệu', async () => {
    const res = await request(app).get(`/api/v1/circulation/books/${doc.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(doc.id);
  });

  test('Tài liệu không tồn tại → 404', async () => {
    const res = await request(app).get('/api/v1/circulation/books/999999');
    expect(res.status).toBe(404);
  });
});

// ── Helper: tạo NhanVien thật để tránh FK violation ──────────────────────────
async function createStaffNV() {
  const hash = await bcrypt.hash('pass', 10);
  return db.NhanVien.create({
    ma_nhan_vien: `NV${Date.now().toString().slice(-10)}`,
    ho_ten: 'Test NV', email: `snv_${Date.now()}@t.com`,
    password_hash: hash, vai_tro: 'thu_thu', trang_thai: 'hoat_dong',
  });
}

// ── C3: Cho mượn ─────────────────────────────────────────────────────────────
describe('C3 — Cho mượn tài liệu', () => {
  let doc, copy, member, token, staffNV;
  beforeAll(async () => {
    doc = await createDoc();
    copy = await createCopy(doc.id);
    member = await createMember();
    staffNV = await createStaffNV();
    token = jwt.sign({ id: staffNV.id, role: 'thu_thu', userType: 'staff', hoTen: 'Test' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Đảm bảo có cấu hình quy định
    await db.CauHinhQuyDinh.findOrCreate({
      where: { hang_muc_ban_doc: 'sinh_vien', loai_tai_lieu: 'mac_dinh' },
      defaults: { so_muon_toi_da: 5, thoi_han_muon_ngay: 14, so_lan_gia_han_toi_da: 2 },
    });
  });
  afterAll(async () => {
    await db.PhieuMuon.destroy({ where: { ban_doc_id: member.id } });
    await db.BanSao.destroy({ where: { id: copy.id } });
    await db.TaiLieu.destroy({ where: { id: doc.id } });
    await db.BanDoc.destroy({ where: { id: member.id } });
    if (staffNV) await staffNV.destroy();
  });

  test('Cho mượn thành công', async () => {
    const res = await request(app)
      .post('/api/v1/circulation/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ banDocId: member.id, maBanSao: copy.ma_ban_sao });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loan).toBeTruthy();
  });

  test('Mã bản sao không tồn tại → lỗi', async () => {
    const res = await request(app)
      .post('/api/v1/circulation/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ banDocId: member.id, maBanSao: 'BS_NOT_EXIST' });

    expect(res.status).toBe(404);
  });

  test('Bản sao đang mượn → lỗi', async () => {
    // copy hiện tại đã được mượn ở test trên
    const res = await request(app)
      .post('/api/v1/circulation/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ banDocId: member.id, maBanSao: copy.ma_ban_sao });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/circulation/loans')
      .send({ banDocId: member.id, maBanSao: copy.ma_ban_sao });

    expect(res.status).toBe(401);
  });
});

// ── C4: Trả sách ─────────────────────────────────────────────────────────────
describe('C4 — Trả sách', () => {
  let doc, copy, member, loan;
  const token = staffToken();

  beforeAll(async () => {
    doc = await createDoc();
    copy = await createCopy(doc.id);
    member = await createMember();
    await db.CauHinhQuyDinh.findOrCreate({
      where: { hang_muc_ban_doc: 'sinh_vien', loai_tai_lieu: 'mac_dinh' },
      defaults: { so_muon_toi_da: 5, thoi_han_muon_ngay: 14, so_lan_gia_han_toi_da: 2 },
    });
    // Tạo phiếu mượn trực tiếp
    loan = await db.PhieuMuon.create({
      ma_phieu_muon: `PM_TEST_${Date.now()}`,
      ban_doc_id: member.id,
      ban_sao_id: copy.id,
      nhan_vien_muon_id: 1,
      ngay_muon: new Date(),
      ngay_hen_tra: new Date(Date.now() + 14 * 86400000),
      trang_thai: 'dang_muon',
    });
    await copy.update({ trang_thai: 'dang_muon' });
  });

  afterAll(async () => {
    await db.PhieuMuon.destroy({ where: { id: loan.id } });
    await db.BanSao.destroy({ where: { id: copy.id } });
    await db.TaiLieu.destroy({ where: { id: doc.id } });
    await db.BanDoc.destroy({ where: { id: member.id } });
  });

  test('Trả sách thành công (nguyên vẹn)', async () => {
    const res = await request(app)
      .post('/api/v1/circulation/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({ maBanSao: copy.ma_ban_sao, tinhTrang: 'ok' });

    expect(res.status).toBe(200);
    expect(res.body.data.loan.trang_thai).toMatch(/da_tra/);
  });

  test('Bản sao không đang mượn → lỗi', async () => {
    const res = await request(app)
      .post('/api/v1/circulation/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({ maBanSao: copy.ma_ban_sao, tinhTrang: 'ok' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
