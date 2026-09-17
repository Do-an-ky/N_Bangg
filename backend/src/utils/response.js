'use strict';

const ok = (res, data, message = 'Thành công', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data, message = 'Tạo mới thành công') =>
  res.status(201).json({ success: true, message, data });

const paginated = (res, rows, count, page, limit) =>
  res.status(200).json({
    success: true,
    data: rows,
    pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / limit) },
  });

module.exports = { ok, created, paginated };
