'use strict';
const svc = require('../services/documentService');
const { ok, created, paginated } = require('../utils/response');

// ── A1/A3: Tài liệu ──────────────────────────────────────────────────────────
async function listDocuments(req, res, next) {
  try {
    const { q, loaiTaiLieu, trangThai, nhaCungCapId, page, limit } = req.query;
    const result = await svc.listDocuments({ q, loaiTaiLieu, trangThai, nhaCungCapId, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

async function getDocument(req, res, next) {
  try {
    const doc = await svc.getDocumentById(req.params.id);
    ok(res, doc);
  } catch (e) { next(e); }
}

// A1: Thêm tài liệu mới
async function createDocument(req, res, next) {
  try {
    const doc = await svc.createDocument(req.body, req.user.id, req.ip);
    created(res, doc, 'Thêm tài liệu thành công. Vui lòng tiến hành biên mục (A2)');
  } catch (e) { next(e); }
}

// A2: Biên mục
async function catalogDocument(req, res, next) {
  try {
    const doc = await svc.catalogDocument(req.params.id, req.body, req.user.id, req.ip);
    ok(res, doc, 'Biên mục thành công. Tài liệu đã được kích hoạt');
  } catch (e) { next(e); }
}

// A3: Cập nhật
async function updateDocument(req, res, next) {
  try {
    const doc = await svc.updateDocument(req.params.id, req.body, req.user.id, req.ip);
    ok(res, doc, 'Cập nhật thông tin tài liệu thành công');
  } catch (e) { next(e); }
}

// A4-Alt1: Ngừng lưu thông
async function stopCirculation(req, res, next) {
  try {
    const doc = await svc.stopCirculation(req.params.id, req.user.id, req.ip);
    ok(res, doc, 'Ngừng lưu thông tài liệu thành công');
  } catch (e) { next(e); }
}

// ── Bản sao ───────────────────────────────────────────────────────────────────
async function getCopies(req, res, next) {
  try {
    const copies = await svc.getCopiesByDocument(req.params.id);
    ok(res, copies);
  } catch (e) { next(e); }
}

async function addCopies(req, res, next) {
  try {
    const copies = await svc.addCopies(req.params.id, req.body.banSao, req.user.id, req.ip);
    created(res, copies, `Thêm ${copies.length} bản sao thành công`);
  } catch (e) { next(e); }
}

// A4: Thanh lý bản sao
async function discardCopy(req, res, next) {
  try {
    const copy = await svc.discardCopy(req.params.banSaoId, req.body.lyDo, req.user.id, req.ip);
    ok(res, copy, 'Thanh lý bản sao thành công');
  } catch (e) { next(e); }
}

// ── A5: Nhà cung cấp ─────────────────────────────────────────────────────────
async function listSuppliers(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const result = await svc.listSuppliers({ q, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

async function createSupplier(req, res, next) {
  try {
    const s = await svc.createSupplier(req.body, req.user.id);
    created(res, s, 'Thêm nhà cung cấp thành công');
  } catch (e) { next(e); }
}

async function updateSupplier(req, res, next) {
  try {
    const s = await svc.updateSupplier(req.params.id, req.body);
    ok(res, s, 'Cập nhật nhà cung cấp thành công');
  } catch (e) { next(e); }
}

// ── A5: Đơn đặt hàng ─────────────────────────────────────────────────────────
async function listOrders(req, res, next) {
  try {
    const { trangThai, nhaCungCapId, page, limit } = req.query;
    const result = await svc.listOrders({ trangThai, nhaCungCapId, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

async function createOrder(req, res, next) {
  try {
    const order = await svc.createOrder(req.body, req.user.id, req.ip);
    created(res, order, 'Tạo đơn đặt hàng thành công');
  } catch (e) { next(e); }
}

async function approveOrder(req, res, next) {
  try {
    const order = await svc.approveOrder(req.params.id, req.user.id);
    ok(res, order, 'Duyệt đơn đặt hàng thành công');
  } catch (e) { next(e); }
}

async function receiveOrder(req, res, next) {
  try {
    const result = await svc.receiveOrder(req.params.id, req.user.id, req.ip);
    ok(res, result, `Nhập hàng thành công. Đã tạo ${result.createdCopies.length} bản sao`);
  } catch (e) { next(e); }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await svc.cancelOrder(req.params.id, req.body.lyDo, req.user.id);
    ok(res, order, 'Hủy đơn đặt hàng thành công');
  } catch (e) { next(e); }
}

// ── Kiểm kê ──────────────────────────────────────────────────────────────────
async function listInventory(req, res, next) {
  try {
    const result = await svc.listInventorySessions(req.query);
    paginated(res, result.rows, result.count, Number(req.query.page) || 1, Number(req.query.limit) || 20);
  } catch (e) { next(e); }
}

async function startInventory(req, res, next) {
  try {
    const session = await svc.startInventory(req.body.ghiChu, req.user.id);
    created(res, session, 'Bắt đầu phiên kiểm kê');
  } catch (e) { next(e); }
}

async function recordItem(req, res, next) {
  try {
    const { maBanSao, tinhTrang, ghiChu } = req.body;
    const item = await svc.recordInventoryItem(req.params.id, maBanSao, tinhTrang, ghiChu);
    ok(res, item, 'Ghi nhận bản sao thành công');
  } catch (e) { next(e); }
}

async function finishInventory(req, res, next) {
  try {
    const session = await svc.finishInventory(req.params.id, req.user.id);
    ok(res, session, 'Kết thúc phiên kiểm kê thành công');
  } catch (e) { next(e); }
}

async function getInventory(req, res, next) {
  try {
    const result = await svc.getInventoryById(req.params.id);
    ok(res, result);
  } catch (e) { next(e); }
}

module.exports = {
  listDocuments, getDocument, createDocument, catalogDocument, updateDocument, stopCirculation,
  getCopies, addCopies, discardCopy,
  listSuppliers, createSupplier, updateSupplier,
  listOrders, createOrder, approveOrder, receiveOrder, cancelOrder,
  listInventory, startInventory, recordItem, finishInventory, getInventory,
};
