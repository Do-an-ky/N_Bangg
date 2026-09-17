'use strict';
require('./setup');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../models');

function staffToken(role = 'thu_thu') {
  return jwt.sign({ id: 999, role, userType: 'staff', hoTen: 'Test' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const thuThuToken = staffToken('thu_thu');
const quanLyToken = staffToken('quan_ly');

describe('B1 — Đăng ký bạn đọc', () => {
  const ids = [];
  afterAll(async () => { if (ids.length) await db.BanDoc.destroy({ where: { id: ids } }); });

  test('Đăng ký thành công', async () => {
    const res = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${thuThuToken}`)
      .send({
        hoTen: 'Nguyễn Test Mới',
        email: `new_${Date.now()}@test.com`,
        soDienThoai: '0912345678',
        soCmnd: String(Date.now()).slice(0, 12),
        hangMuc: 'sinh_vien',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.ma_the || res.body.data.maThe).toBeTruthy();
    ids.push(res.body.data.id);
  });

  test('Email trùng → lỗi', async () => {
    const ts = Date.now();
    const email = `dup_${ts}@test.com`;
    const cmnd1 = String(ts).slice(0, 12);
    const cmnd2 = String(ts + 1).slice(0, 12);
    const r1 = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${thuThuToken}`)
      .send({ hoTen: 'Test A', email, soDienThoai: '0912345679', soCmnd: cmnd1, hangMuc: 'sinh_vien' });
    if (r1.body.data?.id) ids.push(r1.body.data.id);

    const res = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${thuThuToken}`)
      .send({ hoTen: 'Test B', email, soDienThoai: '0912345680', soCmnd: cmnd2, hangMuc: 'giang_vien' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('Thiếu hoTen (bắt buộc) → 400', async () => {
    const res = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${thuThuToken}`)
      .send({ hangMuc: 'sinh_vien' }); // thiếu hoTen

    expect(res.status).toBe(400);
  });

  test('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/members')
      .send({ hoTen: 'Test', email: 'x@test.com', soDienThoai: '0912345678', soCmnd: '000000000001', hangMuc: 'sinh_vien' });

    expect(res.status).toBe(401);
  });
});

describe('B3 — Khóa thẻ', () => {
  let member;
  beforeAll(async () => {
    member = await db.BanDoc.create({
      ma_the: `BDL${Date.now().toString().slice(-10)}`,
      ho_ten: 'Test Lock',
      email: `lock_${Date.now()}@test.com`,
      so_cmnd: String(Date.now()).slice(0, 12),
      ngay_dang_ky: new Date().toISOString().split('T')[0],
      hang_muc: 'sinh_vien',
      trang_thai_the: 'hoat_dong',
      ngay_het_han: '2099-12-31',
    });
  });
  afterAll(async () => { await member.destroy(); });

  test('Khóa thẻ thành công', async () => {
    const res = await request(app)
      .post(`/api/v1/members/${member.id}/lock`)
      .set('Authorization', `Bearer ${thuThuToken}`)
      .send({ lyDo: 'Vi phạm nội quy thư viện' });

    expect(res.status).toBe(200);
  });

  test('Mở khóa thẻ (quan_ly)', async () => {
    const res = await request(app)
      .post(`/api/v1/members/${member.id}/unlock`)
      .set('Authorization', `Bearer ${quanLyToken}`);

    expect(res.status).toBe(200);
  });

  test('Thu thư không thể mở khóa → 403', async () => {
    // Khóa lại trước
    await member.update({ trang_thai_the: 'bi_khoa' });
    const res = await request(app)
      .post(`/api/v1/members/${member.id}/unlock`)
      .set('Authorization', `Bearer ${thuThuToken}`);

    expect(res.status).toBe(403);
  });
});
