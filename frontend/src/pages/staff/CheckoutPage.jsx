// C3 - Cho mượn tài liệu
import React, { useState, useRef } from 'react';
import { checkoutBook, getMember } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

export default function CheckoutPage() {
  const toast = useToast();
  const copyRef = useRef(null);

  const [maThe, setMaThe] = useState('');
  const [maBanSao, setMaBanSao] = useState('');
  const [member, setMember] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [error, setError] = useState('');

  // Lookup bạn đọc theo mã thẻ
  async function handleLookupMember(e) {
    e.preventDefault();
    if (!maThe.trim()) return;
    setLoadingMember(true);
    setMemberError('');
    setMember(null);
    setResult(null);
    try {
      // Tìm bạn đọc qua danh sách với filter maThe
      const res = await import('../../api/staff').then((m) => m.listMembers({ search: maThe.trim(), limit: 1 }));
      const found = res.data?.[0];
      if (!found) { setMemberError('Không tìm thấy thẻ bạn đọc với mã này.'); return; }
      setMember(found);
      // Focus sang ô mã bản sao
      setTimeout(() => copyRef.current?.focus(), 100);
    } catch (err) {
      setMemberError(err.message);
    } finally {
      setLoadingMember(false);
    }
  }

  async function handleCheckout(e) {
    e.preventDefault();
    if (!member || !maBanSao.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await checkoutBook({ banDocId: member.id, maBanSao: maBanSao.trim() });
      setResult(res);
      toast.success(res.message || 'Cho mượn thành công!');
      // Reset bản sao để mượn tiếp cho cùng bạn đọc
      setMaBanSao('');
      setTimeout(() => copyRef.current?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMaThe('');
    setMaBanSao('');
    setMember(null);
    setResult(null);
    setError('');
    setMemberError('');
  }

  const cardOk = member?.trang_thai_the === 'hoat_dong';

  return (
    <StaffLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cho mượn tài liệu <span className="text-sm font-normal text-gray-400">(C3)</span></h1>

        {/* Bước 1: Tìm bạn đọc */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">① Quét / nhập mã thẻ bạn đọc</h2>
          <form onSubmit={handleLookupMember} className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Mã thẻ bạn đọc (VD: BD20240001)"
              value={maThe}
              onChange={(e) => setMaThe(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary px-5" disabled={loadingMember || !maThe.trim()}>
              {loadingMember ? <Spinner size="sm" /> : 'Tìm'}
            </button>
          </form>

          {memberError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              ⚠️ {memberError}
            </div>
          )}

          {/* Thông tin bạn đọc */}
          {member && (
            <div className={`mt-4 rounded-lg border p-4 ${cardOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
                  <Field label="Họ tên" value={member.ho_ten} />
                  <Field label="Mã thẻ" value={member.ma_the} />
                  <Field label="Hạng mục" value={{ sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', ngoai: 'Ngoài trường' }[member.hang_muc]} />
                  <Field label="Hết hạn thẻ" value={member.ngay_het_han} />
                </div>
                <StatusBadge status={member.trang_thai_the} />
              </div>
              {!cardOk && (
                <p className="mt-2 text-sm text-red-700 font-medium">
                  ⚠️ Thẻ không hợp lệ — không thể thực hiện mượn. Yêu cầu bạn đọc liên hệ quầy thông tin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bước 2: Quét bản sao */}
        {member && cardOk && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">② Quét mã vạch bản sao</h2>
            <form onSubmit={handleCheckout} className="flex gap-3">
              <input
                ref={copyRef}
                className="input flex-1 font-mono"
                placeholder="Mã bản sao (VD: BS000001)"
                value={maBanSao}
                onChange={(e) => setMaBanSao(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary px-5"
                disabled={loading || !maBanSao.trim()}
              >
                {loading ? <Spinner size="sm" /> : 'Cho mượn'}
              </button>
            </form>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Kết quả */}
        {result && (
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-3 text-green-700">
              <span className="text-2xl">✅</span>
              <h2 className="font-semibold">Cho mượn thành công!</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Mã phiếu mượn" value={result.data?.loan?.ma_phieu_muon} />
              <Field label="Ngày mượn" value={result.data?.loan?.ngay_muon} />
              <Field label="Hạn trả" value={result.data?.ngayHenTra} />
              <Field label="Mã bản sao" value={result.data?.copy?.ma_ban_sao} />
            </div>
            <p className="text-xs text-green-700 mt-3">
              💡 Có thể quét bản sao tiếp theo để mượn thêm cho cùng bạn đọc này.
            </p>
          </div>
        )}

        {member && (
          <button onClick={handleReset} className="btn-secondary w-full">
            Bạn đọc mới →
          </button>
        )}
      </div>
    </StaffLayout>
  );
}
