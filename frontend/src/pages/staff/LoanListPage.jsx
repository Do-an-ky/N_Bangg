// C5/C7: Danh sách phiếu mượn + gia hạn + báo mất/hỏng
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFineStats, reportLostDamaged } from '../../api/staff';
import api from '../../api/index';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'dang_muon', label: 'Đang mượn' },
  { value: 'qua_han', label: 'Quá hạn' },
  { value: 'da_tra', label: 'Đã trả' },
];

function daysDiff(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  return Math.floor((today - d) / 86400000);
}

export default function LoanListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trangThai, setTrangThai] = useState(searchParams.get('trangThai') || '');
  const [actionLoading, setActionLoading] = useState({});

  const fetchLoans = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/circulation/loans', {
        params: { search: search || undefined, trangThai: trangThai || undefined, page: p, limit: 20 },
      });
      setLoans(res.data);
      setTotal(res.pagination?.total || res.data.length);
      setPage(p);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, trangThai]);

  useEffect(() => { fetchLoans(1); }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchLoans(1);
  }

  async function handleRenew(loanId) {
    setActionLoading((prev) => ({ ...prev, [loanId]: 'renew' }));
    try {
      await api.post(`/circulation/loans/${loanId}/renew`);
      toast.success('Gia hạn thành công!');
      fetchLoans(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [loanId]: null }));
    }
  }

  async function handleReport(loanId, loai) {
    setActionLoading((prev) => ({ ...prev, [loanId]: loai }));
    try {
      await reportLostDamaged(loanId, loai);
      toast.info(`Đã ghi nhận ${loai === 'mat' ? 'mất' : 'hỏng'} — phiếu phạt đã tạo.`);
      fetchLoans(page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [loanId]: null }));
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <StaffLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Phiếu mượn <span className="text-sm font-normal text-gray-400">(C5, C7)</span></h1>

        {/* Filter */}
        <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-48"
            placeholder="Tên bạn đọc, mã thẻ, mã bản sao..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-44"
            value={trangThai}
            onChange={(e) => { setTrangThai(e.target.value); }}
          >
            {TRANG_THAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit" className="btn-primary px-6" disabled={loading}>Tìm</button>
        </form>

        {!loading && <p className="text-sm text-gray-500">Tổng: {total} phiếu mượn</p>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : loans.length === 0 ? (
          <EmptyState icon="📋" title="Không tìm thấy phiếu mượn" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Mã phiếu', 'Bạn đọc', 'Tài liệu', 'Mượn', 'Hạn trả', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loans.map((l) => {
                    const late = l.ngay_hen_tra && daysDiff(l.ngay_hen_tra) > 0 && l.trang_thai === 'dang_muon';
                    const daysLate = late ? daysDiff(l.ngay_hen_tra) : 0;
                    const canRenew = l.trang_thai === 'dang_muon';
                    const canReport = l.trang_thai === 'dang_muon';
                    const act = actionLoading[l.id];
                    return (
                      <tr key={l.id} className={`hover:bg-gray-50 ${late ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{l.ma_phieu_muon}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{l.banDoc?.ho_ten}</p>
                          <p className="text-xs text-gray-400 font-mono">{l.banDoc?.ma_the}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 max-w-48 truncate">{l.banSao?.taiLieu?.nhan_de}</p>
                          <p className="text-xs text-gray-400 font-mono">{l.banSao?.ma_ban_sao}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{l.ngay_muon}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className={`text-xs font-medium ${late ? 'text-red-600' : 'text-gray-700'}`}>
                            {l.ngay_hen_tra}
                            {late && <span className="ml-1">⚠️ +{daysLate}d</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={l.trang_thai} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {/* C5: Gia hạn */}
                            {canRenew && (
                              <button
                                onClick={() => handleRenew(l.id)}
                                disabled={!!act}
                                className="text-xs px-2.5 py-1 rounded border border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                              >
                                {act === 'renew' ? <Spinner size="sm" /> : 'Gia hạn'}
                              </button>
                            )}
                            {/* C7: Báo mất */}
                            {canReport && (
                              <button
                                onClick={() => handleReport(l.id, 'mat')}
                                disabled={!!act}
                                className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {act === 'mat' ? <Spinner size="sm" /> : 'Mất sách'}
                              </button>
                            )}
                            {/* C7: Báo hỏng */}
                            {canReport && (
                              <button
                                onClick={() => handleReport(l.id, 'hong')}
                                disabled={!!act}
                                className="text-xs px-2.5 py-1 rounded border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                              >
                                {act === 'hong' ? <Spinner size="sm" /> : 'Hỏng sách'}
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
            <button className="btn-secondary px-3" onClick={() => fetchLoans(page - 1)} disabled={page <= 1 || loading}>← Trước</button>
            <span className="flex items-center text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <button className="btn-secondary px-3" onClick={() => fetchLoans(page + 1)} disabled={page >= totalPages || loading}>Tiếp →</button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
