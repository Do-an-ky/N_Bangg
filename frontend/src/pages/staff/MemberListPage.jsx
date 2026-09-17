// B1-B4: Quản lý bạn đọc
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMembers } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const HANG_MUC = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', ngoai: 'Ngoài trường' };
const TRANG_THAI = { hoat_dong: 'Hoạt động', bi_khoa: 'Bị khóa', het_han: 'Hết hạn', da_huy: 'Đã hủy' };

export default function MemberListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [hangMuc, setHangMuc] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await listMembers({ search: search || undefined, hangMuc: hangMuc || undefined, trangThai: trangThai || undefined, page: p, limit: 20 });
      setMembers(res.data);
      setTotal(res.pagination.total);
      setPage(p);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [search, hangMuc, trangThai]);

  useEffect(() => { fetch(1); }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetch(1);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bạn đọc</h1>
          <Link to="/staff/members/new" className="btn-primary">
            + Đăng ký thẻ mới
          </Link>
        </div>

        {/* Bộ lọc */}
        <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-48"
            placeholder="Tìm theo tên, mã thẻ, CMND..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-40" value={hangMuc} onChange={(e) => setHangMuc(e.target.value)}>
            <option value="">Tất cả hạng mục</option>
            {Object.entries(HANG_MUC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="input w-40" value={trangThai} onChange={(e) => setTrangThai(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" className="btn-primary px-6" disabled={loading}>Tìm</button>
        </form>

        {/* Count */}
        {!loading && <p className="text-sm text-gray-500">Tổng: {total} bạn đọc</p>}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : members.length === 0 ? (
          <EmptyState icon="👥" title="Không tìm thấy bạn đọc" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Mã thẻ', 'Họ tên', 'Hạng mục', 'Hết hạn', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => {
                    const expiring = new Date(m.ngay_het_han) < new Date(Date.now() + 30 * 86400000);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/staff/members/${m.id}`)}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.ma_the}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{m.ho_ten}</td>
                        <td className="px-4 py-3 text-gray-500">{HANG_MUC[m.hang_muc]}</td>
                        <td className={`px-4 py-3 text-xs ${expiring && m.trang_thai_the === 'hoat_dong' ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                          {m.ngay_het_han}
                          {expiring && m.trang_thai_the === 'hoat_dong' && ' ⚠️'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={m.trang_thai_the} /></td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/staff/members/${m.id}`}
                            className="text-primary-600 hover:underline text-xs font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Xem chi tiết →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button className="btn-secondary px-3" onClick={() => fetch(page - 1)} disabled={page <= 1 || loading}>← Trước</button>
            <span className="flex items-center text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <button className="btn-secondary px-3" onClick={() => fetch(page + 1)} disabled={page >= totalPages || loading}>Tiếp →</button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
