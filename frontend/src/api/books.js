import api from './index';

// C1: Tra cứu tài liệu
export const searchBooks = (params) =>
  api.get('/circulation/books', { params });

export const getBookDetail = (id) =>
  api.get(`/circulation/books/${id}`);

// C2: Đặt trước
export const createReservation = (taiLieuId) =>
  api.post('/circulation/reservations', { taiLieuId });

export const cancelReservation = (id) =>
  api.delete(`/circulation/reservations/${id}`);

export const getMyReservations = (banDocId) =>
  api.get(`/circulation/members/${banDocId}/reservations`);

// C3/C5: Mượn & gia hạn
export const getMyLoans = (banDocId, trangThai) =>
  api.get(`/circulation/members/${banDocId}/loans`, { params: { trangThai } });

export const renewLoan = (phieuMuonId) =>
  api.post(`/circulation/loans/${phieuMuonId}/renew`);
