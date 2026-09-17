// D3 - Xem công nợ / phiếu phạt
import React, { useState, useEffect } from 'react';
import { getMyDebt } from '../../api/member';
import { useAuth } from '../../store/AuthContext';
import MemberLayout from '../../components/layout/MemberLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const LOAI_MAP = {
  tre_han: 'Trả trễ hạn',
  mat_sach: 'Mất tài liệu',
  hong_sach: 'Hư hỏng tài liệu',
};

function formatVND(amount) {
  return Number(amount).toLocaleString('vi-VN') + ' VNĐ';
}

export default function MyDebtPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDebt(user.id)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Công nợ & Phiếu phạt</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !data ? null : (
          <>
            {/* Tổng công nợ */}
            <div className={`card border-l-4 ${data.total > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tổng công nợ chưa thanh toán</p>
                  <p className={`text-3xl font-bold ${data.total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatVND(data.total)}
                  </p>
                </div>
                {data.total > 0 ? (
                  <div className="text-4xl">⚠️</div>
                ) : (
                  <div className="text-4xl">✅</div>
                )}
              </div>
              {data.total > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Vui lòng đến quầy thủ thư để thanh toán trước khi mượn thêm tài liệu.
                </p>
              )}
            </div>

            {/* Danh sách phiếu phạt */}
            {data.fines.length === 0 ? (
              <EmptyState icon="💰" title="Không có phiếu phạt" description="Bạn không có khoản nợ nào cần thanh toán." />
            ) : (
              <div className="space-y-3">
                <h2 className="font-semibold text-gray-700">Chi tiết các phiếu phạt</h2>
                {data.fines.map((fine) => (
                  <div key={fine.id} className="card">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge bg-orange-100 text-orange-700">
                            {LOAI_MAP[fine.loai_phat] || fine.loai_phat}
                          </span>
                          <StatusBadge status={fine.trang_thai_thanh_toan} />
                        </div>
                        <p className="font-medium text-gray-900">
                          {fine.phieuMuon?.banSao?.taiLieu?.nhan_de || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                          <span>📅 Ngày phát sinh: {new Date(fine.created_at).toLocaleDateString('vi-VN')}</span>
                          {fine.so_ngay_tre > 0 && <span>📆 Số ngày trễ: {fine.so_ngay_tre} ngày</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-red-600">{formatVND(fine.so_tien)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Mã: {fine.ma_phieu_phat}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MemberLayout>
  );
}
