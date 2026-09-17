import api from './index';

// ── B: Quản lý bạn đọc ────────────────────────────────────────────────────────
export const listMembers = (params) => api.get('/members', { params });
export const getMember = (id) => api.get(`/members/${id}`);
export const registerMember = (data) => api.post('/members', data);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const renewMemberCard = (id) => api.post(`/members/${id}/renew`);
export const lockMemberCard = (id, lyDo) => api.post(`/members/${id}/lock`, { lyDo });
export const unlockMemberCard = (id) => api.post(`/members/${id}/unlock`);
export const cancelMemberCard = (id) => api.delete(`/members/${id}`);
export const getMemberDebt = (id) => api.get(`/members/${id}/debt`);
export const getMemberLoans = (id, trangThai) =>
  api.get(`/circulation/members/${id}/loans`, { params: { trangThai } });

// ── C: Lưu thông ──────────────────────────────────────────────────────────────
export const checkoutBook = (data) => api.post('/circulation/loans', data);
export const returnBook = (data) => api.post('/circulation/returns', data);
export const reportLostDamaged = (loanId, loai) =>
  api.post(`/circulation/loans/${loanId}/report`, { loai });

// ── D: Phiếu phạt ─────────────────────────────────────────────────────────────
export const payFine = (id) => api.post(`/circulation/fines/${id}/pay`);
export const waiveFine = (id, data) => api.post(`/circulation/fines/${id}/waive`, data);
export const getFineStats = (params) => api.get('/reports/fines', { params });

// ── A: Tài liệu ───────────────────────────────────────────────────────────────
export const listDocuments = ({ search, ...rest } = {}) => api.get('/documents', { params: { q: search, ...rest } });
export const getDocument = (id) => api.get(`/documents/${id}`);
export const createDocument = (data) => api.post('/documents', data);
export const catalogDocument = (id, data) => api.post(`/documents/${id}/catalog`, data);
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const getCopies = (docId) => api.get(`/documents/${docId}/copies`);
export const addCopies = (docId, banSao) => api.post(`/documents/${docId}/copies`, { banSao });
export const discardCopy = (docId, copyId, lyDo) =>
  api.delete(`/documents/${docId}/copies/${copyId}`, { data: { lyDo } });
export const stopCirculation = (docId) => api.post(`/documents/${docId}/stop-circulation`);

// A5
export const listSuppliers = (params) => api.get('/documents/suppliers', { params });
export const createSupplier = (data) => api.post('/documents/suppliers', data);
export const listOrders = (params) => api.get('/documents/orders', { params });
export const createOrder = (data) => api.post('/documents/orders', data);
export const approveOrder = (id) => api.post(`/documents/orders/${id}/approve`);
export const receiveOrder = (id) => api.post(`/documents/orders/${id}/receive`);

// ── F: Báo cáo ────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/reports/dashboard');
export const getLoanStats = (params) => api.get('/reports/loans', { params });
export const getDocumentStats = () => api.get('/reports/documents');
export const getMemberStats = () => api.get('/reports/members');
