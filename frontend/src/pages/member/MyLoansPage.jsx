// C3 xem tình trạng + C5 Gia hạn
import React, { useState, useEffect } from 'react';
import { getMyLoans, renewLoan } from '../../api/books';
import { useAuth } from '../../store/AuthContext';
import MemberLayout from '../../components/layout/MemberLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

function daysDiff(date) {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MyLoansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('active'); // 'active' | 'history'
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(null); // phieuMuonId đang gia hạn

  async function fetchLoans(trangThai) {
    setLoading(true);
    try {
      const res = await getMyLoans(user.id, trangThai || undefined);
      setLoans(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoans(tab === 'active' ? 'dang_muon' : null);
  }, [tab]);

  async function handleRenew(loanId) {
    setRenewing(loanId);
    try {
      const res = await renewLoan(loanId);
      toast.success(res.message || 'Gia hạn thành công!');
      fetchLoans('dang_muon');
    } catch (err) {
      // Nielsen #9: thông báo lỗi cụ thể
      toast.error(err.message);
    } finally {
      setRenewing(null);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <MemberLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sách đang mượn</h1>

        {/* Tab */}
        <div className="flex border-b border-gray-200 gap-4">
          {[
            { key: 'active', label: 'Đang mượn' },
            { key: 'history', label: 'Lịch sử mượn' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : loans.length === 0 ? (
          <EmptyState
            icon={tab === 'active' ? '📚' : '📋'}
            title={tab === 'active' ? 'Bạn chưa mượn tài liệu nào' : 'Chưa có lịch sử mượn'}
            description="Đến quầy thủ thư để mượn tài liệu hoặc tra cứu để đặt trước."
          />
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const daysLeft = daysDiff(loan.ngay_hen_tra);
              const isOverdue = tab === 'active' && loan.ngay_hen_tra < today;
              const isNearDue = tab === 'active' && !isOverdue && daysLeft <= 3;

              return (
                <div
                  key={loan.id}
                  className={`card border-l-4 ${
                    isOverdue ? 'border-l-red-500 bg-red-50' :
                    isNearDue ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-primary-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {loan.banSao?.taiLieu?.nhan_de || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {loan.banSao?.taiLieu?.tac_gia}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Mã bản sao: {loan.banSao?.ma_ban_sao}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
                        <span>📅 Ngày mượn: <strong>{loan.ngay_muon}</strong></span>
                        <span
                          className={`font-medium ${isOverdue ? 'text-red-600' : isNearDue ? 'text-yellow-700' : 'text-gray-700'}`}
                        >
                          🗓 Hạn trả: <strong>{loan.ngay_hen_tra}</strong>
                          {tab === 'active' && (
                            isOverdue
                              ? ` (quá hạn ${Math.abs(daysLeft)} ngày)`
                              : ` (còn ${daysLeft} ngày)`
                          )}
                        </span>
                        {loan.so_lan_gia_han > 0 && (
                          <span>🔄 Đã gia hạn: {loan.so_lan_gia_han} lần</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={loan.trang_thai} />
                      {/* C5: Nút gia hạn — chỉ hiện khi đang mượn và không quá hạn */}
                      {loan.trang_thai === 'dang_muon' && !isOverdue && (
                        <button
                          onClick={() => handleRenew(loan.id)}
                          disabled={renewing === loan.id}
                          className="btn-secondary text-xs px-3 py-1"
                          title="Gia hạn thời gian mượn"
                        >
                          {renewing === loan.id ? <Spinner size="sm" /> : '🔄 Gia hạn'}
                        </button>
                      )}
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">
                          ⚠️ Vui lòng trả ngay
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
