// B3 - Bạn đọc tự cập nhật thông tin
import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../api/member';
import { useAuth } from '../../store/AuthContext';
import MemberLayout from '../../components/layout/MemberLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const HANG_MUC_MAP = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', ngoai: 'Ngoài trường' };

export default function ProfilePage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getProfile(user.id)
      .then((res) => {
        setProfile(res.data);
        setForm({
          hoTen: res.data.ho_ten || '',
          email: res.data.email || '',
          soDienThoai: res.data.so_dien_thoai || '',
          diaChi: res.data.dia_chi || '',
          donVi: res.data.don_vi || '',
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Client validation
  function validate() {
    const errs = {};
    if (!form.hoTen.trim()) errs.hoTen = 'Vui lòng nhập họ tên';
    else if (form.hoTen.trim().length < 2) errs.hoTen = 'Họ tên tối thiểu 2 ký tự';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email không hợp lệ';

    if (form.soDienThoai && !/^[0-9]{9,11}$/.test(form.soDienThoai))
      errs.soDienThoai = 'Số điện thoại phải gồm 9-11 chữ số';

    return errs;
  }

  async function handleSave() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await updateProfile(user.id, form);
      setProfile(res.data);
      setEditMode(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <MemberLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></MemberLayout>;

  const daysUntilExpiry = profile
    ? Math.ceil((new Date(profile.ngay_het_han) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <MemberLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bạn đọc</h1>

        {/* Card thông tin thẻ */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Thẻ bạn đọc</p>
              <p className="text-2xl font-bold mt-1 font-mono">{profile?.ma_the}</p>
              <p className="text-lg mt-1">{profile?.ho_ten}</p>
              <p className="text-blue-200 text-sm mt-1">{HANG_MUC_MAP[profile?.hang_muc]}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={profile?.trang_thai_the} />
              <p className="text-xs text-blue-200 mt-2">Hết hạn: {profile?.ngay_het_han}</p>
              {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                <p className="text-xs text-yellow-300 mt-1">⚠️ Sắp hết hạn ({daysUntilExpiry} ngày)</p>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-4">
              {[
                { key: 'hoTen', label: 'Họ và tên', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'soDienThoai', label: 'Số điện thoại', type: 'tel' },
                { key: 'diaChi', label: 'Địa chỉ' },
                { key: 'donVi', label: 'Đơn vị / Khoa' },
              ].map(({ key, label, type = 'text', required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    className={`input ${errors[key] ? 'border-red-400 focus:ring-red-400' : ''}`}
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                  {errors[key] && (
                    <p className="text-red-600 text-xs mt-1">⚠️ {errors[key]}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <><Spinner size="sm" className="mr-2" /> Đang lưu...</> : 'Lưu thay đổi'}
                </button>
                <button onClick={() => { setEditMode(false); setErrors({}); }} className="btn-secondary">
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <dl className="divide-y divide-gray-100">
              {[
                ['Họ và tên', profile?.ho_ten],
                ['Email', profile?.email || '—'],
                ['Số điện thoại', profile?.so_dien_thoai || '—'],
                ['Địa chỉ', profile?.dia_chi || '—'],
                ['Đơn vị / Khoa', profile?.don_vi || '—'],
                ['CMND/CCCD', profile?.so_cmnd || '—'],
                ['Mã sinh viên', profile?.ma_sinh_vien || '—'],
                ['Ngày đăng ký', profile?.ngay_dang_ky],
                ['Ngày hết hạn', profile?.ngay_het_han],
              ].map(([label, value]) => (
                <div key={label} className="flex py-3 text-sm">
                  <dt className="w-40 shrink-0 text-gray-500">{label}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
