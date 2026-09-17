// B1 - Đăng ký thẻ bạn đọc mới
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerMember } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const HANG_MUC = ['sinh_vien', 'giang_vien', 'ngoai'];
const HANG_MUC_LABEL = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên/Cán bộ', ngoai: 'Ngoài trường' };

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function MemberRegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    hoTen: '', email: '', soDienThoai: '', diaChi: '',
    hangMuc: 'sinh_vien', donVi: '', maSinhVien: '', soCmnd: '',
    matKhau: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.hoTen.trim() || form.hoTen.length < 2) errs.hoTen = 'Họ tên phải ít nhất 2 ký tự.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ.';
    if (!form.soDienThoai.trim() || !/^(0|\+84)\d{9}$/.test(form.soDienThoai)) errs.soDienThoai = 'Số điện thoại không hợp lệ (VD: 0912345678).';
    if (!form.soCmnd.trim()) errs.soCmnd = 'Số CMND/CCCD là bắt buộc.';
    if (form.matKhau && form.matKhau.length < 6) errs.matKhau = 'Mật khẩu ít nhất 6 ký tự.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await registerMember({
        hoTen: form.hoTen.trim(),
        email: form.email.trim().toLowerCase(),
        soDienThoai: form.soDienThoai.trim(),
        diaChi: form.diaChi.trim() || undefined,
        hangMuc: form.hangMuc,
        donVi: form.donVi.trim() || undefined,
        maSinhVien: form.maSinhVien.trim() || undefined,
        soCmnd: form.soCmnd.trim(),
        matKhau: form.matKhau || undefined,
      });
      toast.success(`Đăng ký thành công! Mã thẻ: ${res.data?.maThe || ''}`);
      navigate('/staff/members');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <StaffLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký thẻ bạn đọc <span className="text-sm font-normal text-gray-400">(B1)</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Họ tên */}
          <Field label="Họ và tên" required error={errors.hoTen}>
            <input className={`input ${errors.hoTen ? 'border-red-400' : ''}`} value={form.hoTen} onChange={set('hoTen')} placeholder="Nguyễn Văn An" autoFocus />
          </Field>

          {/* Email */}
          <Field label="Email" required error={errors.email}>
            <input className={`input ${errors.email ? 'border-red-400' : ''}`} type="email" value={form.email} onChange={set('email')} placeholder="example@hcmus.edu.vn" />
          </Field>

          {/* SĐT */}
          <Field label="Số điện thoại" required error={errors.soDienThoai}>
            <input className={`input ${errors.soDienThoai ? 'border-red-400' : ''}`} value={form.soDienThoai} onChange={set('soDienThoai')} placeholder="0912345678" />
          </Field>

          {/* CMND */}
          <Field label="Số CMND / CCCD" required error={errors.soCmnd}>
            <input className={`input ${errors.soCmnd ? 'border-red-400' : ''}`} value={form.soCmnd} onChange={set('soCmnd')} placeholder="012345678901" />
          </Field>

          {/* Hạng mục */}
          <Field label="Hạng mục bạn đọc" required>
            <div className="flex gap-3">
              {HANG_MUC.map((h) => (
                <label key={h} className={`flex-1 flex items-center justify-center py-2.5 border-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${form.hangMuc === h ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" className="sr-only" value={h} checked={form.hangMuc === h} onChange={set('hangMuc')} />
                  {HANG_MUC_LABEL[h]}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Đơn vị */}
            <Field label="Đơn vị / Khoa">
              <input className="input" value={form.donVi} onChange={set('donVi')} placeholder="Khoa CNTT" />
            </Field>

            {/* Mã sinh viên */}
            <Field label="Mã sinh viên">
              <input className="input" value={form.maSinhVien} onChange={set('maSinhVien')} placeholder="20120001" />
            </Field>
          </div>

          {/* Địa chỉ */}
          <Field label="Địa chỉ">
            <input className="input" value={form.diaChi} onChange={set('diaChi')} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
          </Field>

          {/* Mật khẩu (tùy chọn) */}
          <Field label="Mật khẩu ban đầu (tùy chọn)" error={errors.matKhau}>
            <input className={`input ${errors.matKhau ? 'border-red-400' : ''}`} type="password" value={form.matKhau} onChange={set('matKhau')} placeholder="Để trống để dùng mật khẩu mặc định" />
          </Field>

          <div className="pt-2 flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-2.5" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Đăng ký thẻ bạn đọc'}
            </button>
            <button type="button" className="btn-secondary px-6" onClick={() => navigate(-1)}>Hủy</button>
          </div>
        </form>
      </div>
    </StaffLayout>
  );
}
