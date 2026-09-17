import api from './index';

// B3: Cập nhật thông tin bản thân
export const getProfile = (id) =>
  api.get(`/members/${id}`);

export const updateProfile = (id, data) =>
  api.put(`/members/${id}`, data);

// D3: Công nợ
export const getMyDebt = (id) =>
  api.get(`/members/${id}/debt`);
