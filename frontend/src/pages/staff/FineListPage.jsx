// D1: Thu phạt + D1-Exc1: Miễn giảm phạt
import React, { useState, useEffect, useCallback } from 'react';
import { getFineStats, payFine, waiveFine } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';

const LOAI_MAP = {
  tra_tre: 'Trả trễ hạn',
  mat_sach: 'Mất sách',
  hong_sach: 'Hỏng sách',
};
const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'chua_thanh_toan', label: 'Chưa thanh toán' },
  { value: 'da_thanh_toan', label: 'Đã thanh toán' },
  { value: 'da_mien_giam', label: 'Đã miễn giảm' },
];

function formatVND(n) { return Number(n || 0).toLocaleString('vi-VN') + ' VNĐ'; }

export default function FineListPage() {
  const toast = useToast();
  const { user } = useAuth();
  const canWaive = ['quan_ly', 'admin'].includes(user?.role);

  const [fines, setFines] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [trangThai, setTrangThai] = useState('chua_thanh_toan');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [waiveModal, setWaiveModal] = useState(null); // { fineId, maSo }
  const [waiveReason, setWaiveReason] = useState('');

  const fetchFines = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getFineStats({ trangThai: trangThai || undefined, search: search || undefined, page: p, limit: 20 });
      setFines(res.data);
      setTotal(res.pagination?.total || res.data.length);
      setPage(p);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [trangThai, search]);

  useEffect(() => { fetchFines(1); }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchFines(1);
  }

  async function handlePay(id) {
    setActionLoading((prev) => ({ ...prev, [id]: 'pay' }));
    try {
      await payFine(id);
      toast.success('Thu phạt thành công!');
      fetchFines(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function handleWaive() {
    if (!waiveModal) return;
    if (!waiveReason.trim() || waiveReason.length < 5) {
      toast.error('Lý do miễn giảm phải ít nhất 5 ký tự.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [waiveModal.fineId]: 'waive' }));
    try {
      await waiveFine(waiveModal.fineId, { lyDo: waiveReason.trim() });
      toast.success('Đã miễn giảm phiếu phạt!');
      setWaiveModal(null);
      setWaiveReason('');
      fetchFines(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [waiveModal?.fineId]: null }));
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <StaffLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Phiếu phạt <span className="text-sm font-normal text-gray-400">(D1)</span></h1>

        {/* Filter */}
        <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-48"
            placeholder="Tên bạn đọc, mã thẻ, mã phiếu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-48" value={trangThai} onChange={(e) => setTrangThai(e.target.value)}>
            {TRANG_THAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit" className="btn-primary px-6" disabled={loading}>Tìm</button>
        </form>

        {!loading && <p className="text-sm text-gray-500">Tổng: {total} phiếu phạt</p>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : fines.length === 0 ? (
          <EmptyState icon="✅" title="Không có phiếu phạt" description="Thay đổi bộ lọc để xem kết quả khác." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Mã phiếu phạt', 'Bạn đọc', 'Loại phạt', 'Ngày tạo', 'Số tiền', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fines.map((f) => {
                    const act = actionLoading[f.id];
                    const isPending = f.trang_thai_thanh_toan === 'chua_thanh_toan';
                    return (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{f.ma_phieu_phat}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{f.banDoc?.ho_ten || f.phieuMuon?.banDoc?.ho_ten}</p>
                          <p className="text-xs text-gray-400 font-mono">{f.banDoc?.ma_the || f.phieuMuon?.banDoc?.ma_the}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{LOAI_MAP[f.loai_phat] || f.loai_phat}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{f.ngay_phat}</td>
                        <td className="px-4 py-3 font-semibold text-orange-700 font-variant-numeric tabular-nums">{formatVND(f.so_tien)}</td>
                        <td className="px-4 py-3"><StatusBadge status={f.trang_thai_thanh_toan} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {/* D1: Thu tiền */}
                            {isPending && (
                              <button
                                onClick={() => handlePay(f.id)}
                                disabled={!!act}
                                className="text-xs px-2.5 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                              >
                                {act === 'pay' ? <Spinner size="sm" /> : `Thu ${formatVND(f.so_tien)}`}
                              </button>
                            )}
                            {/* D1-Exc1: Miễn giảm (quan_ly+) */}
                            {isPending && canWaive && (
                              <button
                                onClick={() => setWaiveModal({ fineId: f.id, maSo: f.ma_phieu_phat })}
                                disabled={!!act}
                                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Miễn giảm
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button className="btn-secondary px-3" onClick={() => fetchFines(page - 1)} disabled={page <= 1 || loading}>← Trước</button>
            <span className="flex items-center text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <button className="btn-secondary px-3" onClick={() => fetchFines(page + 1)} disabled={page >= totalPages || loading}>Tiếp →</button>
          </div>
        )}
      </div>

      {/* Modal miễn giảm — D1-Exc1 */}
      {waiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Miễn giảm phiếu phạt</h3>
            <p className="text-sm text-gray-600">Phiếu: <span className="font-mono">{waiveModal.maSo}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do miễn giảm <span className="text-red-500">*</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="Nhập lý do miễn giảm (bắt buộc)..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleWaive} disabled={!!actionLoading[waiveModal.fineId]} className="btn-primary flex-1">
                {actionLoading[waiveModal.fineId] === 'waive' ? <Spinner size="sm" /> : 'Xác nhận miễn giảm'}
              </button>
              <button onClick={() => { setWaiveModal(null); setWaiveReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
