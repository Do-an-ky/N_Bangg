'use strict';
require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const db = require('../models');

// ── Helpers ────────────────────────────────────────────────────────────────────
async function createStaff(overrides = {}) {
  const hash = await bcrypt.hash('Password@123', 10);
  return db.NhanVien.create({
    ma_nhan_vien: `NV${Date.now().toString().slice(-10)}`,
    ho_ten: 'Test Staff',
    email: `staff_${Date.now()}@test.com`,
    password_hash: hash,
    vai_tro: 'thu_thu',
    trang_thai: 'hoat_dong',
    ...overrides,
  });
}

async function createMember(overrides = {}) {
  const hash = await bcrypt.hash('Member@123', 10);
  return db.BanDoc.create({
    ma_the: `BD_${Date.now()}`,
    ho_ten: 'Test Member',
    email: `member_${Date.now()}@test.com`,
    so_cmnd: String(Date.now()).slice(0, 12),
    hang_muc: 'sinh_vien',
    trang_thai_the: 'hoat_dong',
    ngay_dang_ky: new Date().toISOString().split('T')[0],
    ngay_het_han: '2099-12-31',
    password_hash: hash,
    ...overrides,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('E1 — Đăng nhập', () => {
  let staff;
  beforeAll(async () => { staff = await createStaff(); });
  afterAll(async () => { if (staff) await staff.destroy(); });

  test('Nhân viên đăng nhập thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ email: staff.email, matKhau: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.vaiTro).toBe('thu_thu');
  });

  test('Sai mật khẩu → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ email: staff.email, matKhau: 'WrongPass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Email không tồn tại → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ email: 'notexist@test.com', matKhau: 'Pass@123' });

    expect(res.status).toBe(401);
  });

  test('Thiếu field → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ email: staff.email });

    expect(res.status).toBe(400);
  });
});

describe('E1 — Đăng nhập bạn đọc', () => {
  let member;
  beforeAll(async () => { member = await createMember(); });
  afterAll(async () => { await member.destroy(); });

  test('Bạn đọc đăng nhập thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/member/login')
      .send({ maThe: member.ma_the, matKhau: 'Member@123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  test('Thẻ bị hủy → 401', async () => {
    await member.update({ trang_thai_the: 'da_huy' });
    const res = await request(app)
      .post('/api/v1/auth/member/login')
      .send({ maThe: member.ma_the, matKhau: 'Member@123' });
    expect(res.status).toBe(401);
    await member.update({ trang_thai_the: 'hoat_dong' });
  });
});

describe('E2 — Đổi mật khẩu', () => {
  let staff, token;
  beforeAll(async () => {
    staff = await createStaff();
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ email: staff.email, matKhau: 'Password@123' });
    token = res.body.data.token;
  });
  afterAll(async () => { await staff.destroy(); });

  test('Đổi mật khẩu thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ matKhauCu: 'Password@123', matKhauMoi: 'NewPass@456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Mật khẩu cũ sai → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ matKhauCu: 'WrongOld', matKhauMoi: 'NewPass@789' });

    expect(res.status).toBe(401);
  });

  test('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ matKhauCu: 'Password@123', matKhauMoi: 'NewPass@789' });

    expect(res.status).toBe(401);
  });
});
