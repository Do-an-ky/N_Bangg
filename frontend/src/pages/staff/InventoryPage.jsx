// D2: Kiểm kê tồn kho
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/index';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const TINH_TRANG_THUC_TE = [
  { value: 'co_mat', label: '✅ Có mặt', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'thieu', label: '❌ Thiếu', color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'sai_vi_tri', label: '📍 Sai vị trí', color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { value: 'hu_hong', label: '⚠️ Hư hỏng', color: 'border-orange-400 bg-orange-50 text-orange-700' },
];

// Danh sách phiên kiểm kê
function SessionList({ onSelect }) {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents/inventory').then((r) => setSessions(r.data || [])).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;
  if (sessions.length === 0) return <EmptyState icon="📦" title="Chưa có phiên kiểm kê nào" description="Tạo phiên kiểm kê mới để bắt đầu." />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Mã phiên', 'Ngày bắt đầu', 'Ngày kết thúc', 'Người thực hiện', 'Trạng thái', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.ma_kiem_ke}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{s.ngay_bat_dau?.split('T')[0]}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{s.ngay_ket_thuc?.split('T')[0] || '—'}</td>
              <td className="px-4 py-3 text-gray-700">{s.nguoiThucHien?.ho_ten || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={s.trang_thai} /></td>
              <td className="px-4 py-3">
                {s.trang_thai === 'dang_kiem_ke' && (
                  <button onClick={() => onSelect(s)} className="text-xs text-primary-600 hover:underline font-medium">
                    Nhập kết quả →
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tạo phiên kiểm kê mới
function StartSessionForm({ onStarted }) {
  const toast = useToast();
  const [ghiChu, setGhiChu] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await api.post('/documents/inventory', { ghiChu: ghiChu.trim() || undefined });
      toast.success('Phiên kiểm kê đã bắt đầu!');
      onStarted(res.data);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="card max-w-md">
      <h3 className="font-semibold text-gray-900 mb-4">Bắt đầu phiên kiểm kê mới</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Ghi chú (tùy chọn)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="VD: Kiểm kê quý I/2024, khu vực A..."
          />
        </div>
        <button onClick={handleStart} disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size="sm" /> : 'Bắt đầu kiểm kê'}
        </button>
      </div>
    </div>
  );
}

// Nhập kết quả kiểm kê
function RecordItems({ session, onDone }) {
  const toast = useToast();
  const [maBanSao, setMaBanSao] = useState('');
  const [tinhTrangThucTe, setTinhTrangThucTe] = useState('co_mat');
  const [ghiChu, setGhiChu] = useState('');
  const [recorded, setRecorded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function handleRecord(e) {
    e.preventDefault();
    if (!maBanSao.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/documents/inventory/${session.id}/items`, {
        maBanSao: maBanSao.trim(),
        tinhTrangThucTe,
        ghiChu: ghiChu.trim() || undefined,
      });
      setRecorded((p) => [res.data, ...p]);
      toast.success(`Đã ghi nhận: ${maBanSao.trim()}`);
      setMaBanSao('');
      setGhiChu('');
      setTinhTrangThucTe('co_mat');
      document.getElementById('kiem-ke-input')?.focus();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleFinish() {
    if (!window.confirm('Kết thúc phiên kiểm kê? Không thể chỉnh sửa sau khi kết thúc.')) return;
    setFinishing(true);
    try {
      await api.post(`/documents/inventory/${session.id}/finish`);
      toast.success('Phiên kiểm kê đã hoàn thành!');
      onDone();
    } catch (err) { toast.error(err.message); }
    finally { setFinishing(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Phiên kiểm kê: <span className="font-mono text-primary-700">{session.ma_kiem_ke}</span></p>
          <p className="text-sm text-gray-500">Bắt đầu: {session.ngay_bat_dau?.split('T')[0]}</p>
        </div>
        <button onClick={handleFinish} disabled={finishing} className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
          {finishing ? <Spinner size="sm" /> : '✅ Kết thúc phiên'}
        </button>
      </div>

      {/* Form nhập */}
      <form onSubmit={handleRecord} className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Quét mã bản sao</h3>
        <input
          id="kiem-ke-input"
          className="input font-mono text-lg"
          placeholder="Mã bản sao (VD: BS000001)"
          value={maBanSao}
          onChange={(e) => setMaBanSao(e.target.value)}
          autoFocus
        />

        {/* Tình trạng thực tế */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Tình trạng thực tế</label>
          <div className="grid grid-cols-2 gap-2">
            {TINH_TRANG_THUC_TE.map(({ value, label, color }) => (
              <label
                key={value}
                className={`flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${tinhTrangThucTe === value ? color : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <input type="radio" className="sr-only" value={value} checked={tinhTrangThucTe === value} onChange={() => setTinhTrangThucTe(value)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <input className="input" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="Ghi chú (tùy chọn)" />

        <button type="submit" disabled={loading || !maBanSao.trim()} className="btn-primary w-full">
          {loading ? <Spinner size="sm" /> : 'Ghi nhận bản sao'}
        </button>
      </form>

      {/* Lịch sử trong phiên */}
      {recorded.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Đã ghi nhận ({recorded.length})</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {recorded.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                <span className="font-mono text-gray-700">{r.banSao?.ma_ban_sao || r.ma_ban_sao}</span>
                <StatusBadge status={r.trang_thai_thuc_te} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [activeSession, setActiveSession] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDone() {
    setActiveSession(null);
    setRefreshKey((k) => k + 1);
  }

  if (activeSession) return (
    <StaffLayout>
      <div className="max-w-2xl">
        <button onClick={() => setActiveSession(null)} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Quay lại danh sách</button>
        <RecordItems session={activeSession} onDone={handleDone} />
      </div>
    </StaffLayout>
  );

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Kiểm kê tồn kho <span className="text-sm font-normal text-gray-400">(D2)</span></h1>
          <button onClick={() => setShowNew(!showNew)} className="btn-primary">
            {showNew ? 'Hủy' : '+ Phiên kiểm kê mới'}
          </button>
        </div>

        {showNew && (
          <StartSessionForm onStarted={(s) => { setShowNew(false); setActiveSession(s); }} />
        )}

        <SessionList key={refreshKey} onSelect={setActiveSession} />
      </div>
    </StaffLayout>
  );
}
