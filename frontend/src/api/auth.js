import api from './index';

export const loginMember = (maThe, matKhau) =>
  api.post('/auth/member/login', { maThe, matKhau });

export const loginStaff = (email, matKhau) =>
  api.post('/auth/staff/login', { email, matKhau });

export const getMe = () => api.get('/auth/me');
