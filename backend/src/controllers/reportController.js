'use strict';
const svc = require('../services/reportService');
const { ok, paginated } = require('../utils/response');

// Dashboard tổng quan
async function getDashboard(req, res, next) {
  try {
    const data = await svc.getDashboard();
    ok(res, data);
  } catch (e) { next(e); }
}

// F1: Thống kê mượn/trả
async function getLoanStats(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await svc.getLoanStats(dateFrom, dateTo);
    ok(res, data);
  } catch (e) { next(e); }
}

// F2: Thống kê tài liệu
async function getDocumentStats(req, res, next) {
  try {
    const data = await svc.getDocumentStats();
    ok(res, data);
  } catch (e) { next(e); }
}

// F3: Thống kê bạn đọc
async function getMemberStats(req, res, next) {
  try {
    const data = await svc.getMemberStats();
    ok(res, data);
  } catch (e) { next(e); }
}

// F4: Thống kê phiếu phạt / công nợ
async function getFineStats(req, res, next) {
  try {
    const { trangThai, search, dateFrom, dateTo, page, limit } = req.query;
    const result = await svc.getFineStats({ trangThai, search, dateFrom, dateTo, page, limit });
    paginated(res, result.rows, result.count, Number(page) || 1, Number(limit) || 20);
  } catch (e) { next(e); }
}

// F4: Báo cáo kiểm kê
async function getInventoryReport(req, res, next) {
  try {
    const data = await svc.getInventoryReport(req.params.id);
    ok(res, data);
  } catch (e) { next(e); }
}

module.exports = { getDashboard, getLoanStats, getDocumentStats, getMemberStats, getFineStats, getInventoryReport };
