// E2 - Đổi mật khẩu (dùng chung cho cả bạn đọc và nhân viên)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ matKhauCu: '', matKhauMoi: '', xacNhanMoi: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(f) { return (e) => setForm((p) => ({ ...p, [f]: e.target.value })); }

  function validate() {
    const errs = {};
    if (!form.matKhauCu) errs.matKhauCu = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!form.matKhauMoi || form.matKhauMoi.length < 6) errs.matKhauMoi = 'Mật khẩu mới phải ít nhất 6 ký tự.';
    if (form.matKhauMoi !== form.xacNhanMoi) errs.xacNhanMoi = 'Xác nhận mật khẩu không khớp.';
    if (form.matKhauMoi === form.matKhauCu) errs.matKhauMoi = 'Mật khẩu mới phải khác mật khẩu cũ.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/change-password', { matKhauCu: form.matKhauCu, matKhauMoi: form.matKhauMoi });
      toast.success('Đổi mật khẩu thành công!');
      navigate(-1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const backPath = user?.userType === 'staff' ? '/staff/dashboard' : '/member/profile';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(backPath)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tài khoản: {user?.hoTen}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { field: 'matKhauCu', label: 'Mật khẩu hiện tại', autoFocus: true },
            { field: 'matKhauMoi', label: 'Mật khẩu mới' },
            { field: 'xacNhanMoi', label: 'Xác nhận mật khẩu mới' },
          ].map(({ field, label, autoFocus }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className={`input ${errors[field] ? 'border-red-400' : ''}`}
                value={form[field]}
                onChange={set(field)}
                autoFocus={autoFocus}
                autoComplete={field === 'matKhauCu' ? 'current-password' : 'new-password'}
              />
              {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
            </div>
          ))}

          <div className="pt-2 flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-2.5" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Đổi mật khẩu'}
            </button>
            <button type="button" className="btn-secondary px-6" onClick={() => navigate(backPath)}>Hủy</button>
          </div>
        </form>

        <div className="mt-5 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
          <p className="font-medium">Yêu cầu mật khẩu:</p>
          <p>• Ít nhất 6 ký tự</p>
          <p>• Phải khác mật khẩu hiện tại</p>
        </div>
      </div>
    </div>
  );
}
