// C2: Xem & hủy đặt trước
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyReservations, cancelReservation } from '../../api/books';
import { useAuth } from '../../store/AuthContext';
import MemberLayout from '../../components/layout/MemberLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

export default function MyReservationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // xác nhận hủy

  async function fetch() {
    setLoading(true);
    try {
      const res = await getMyReservations(user.id);
      setReservations(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await cancelReservation(id);
      toast.success('Hủy đặt trước thành công.');
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
      setConfirmId(null);
    }
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Tài liệu đặt trước</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reservations.length === 0 ? (
          <EmptyState
            icon="🔖"
            title="Chưa có yêu cầu đặt trước nào"
            description="Khi tài liệu bạn muốn đang được mượn hết, hãy đặt trước để được ưu tiên."
          />
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const isReady = res.trang_thai === 'da_thong_bao';
              return (
                <div
                  key={res.id}
                  className={`card border-l-4 ${isReady ? 'border-l-green-500 bg-green-50' : 'border-l-blue-400'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/member/books/${res.tai_lieu_id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {res.taiLieu?.nhan_de || 'N/A'}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5">{res.taiLieu?.tac_gia}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                        <span>📅 Ngày đặt: {new Date(res.ngay_dat).toLocaleDateString('vi-VN')}</span>
                        <span>🔢 Vị trí hàng chờ: {res.vi_tri_hang_doi}</span>
                        {isReady && res.han_lay_sach && (
                          <span className="text-green-700 font-medium">
                            ✓ Hạn lấy sách: {res.han_lay_sach}
                          </span>
                        )}
                      </div>

                      {/* C2-Alt1: thông báo sẵn sàng */}
                      {isReady && (
                        <div className="mt-2 text-sm text-green-700 font-medium">
                          📢 Sách đã sẵn sàng — đến quầy thủ thư để lấy trước {res.han_lay_sach}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={res.trang_thai} />

                      {/* Nút hủy — disable nếu sách đã sẵn sàng chờ lấy */}
                      {confirmId === res.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancel(res.id)}
                            disabled={cancelling === res.id}
                            className="btn-danger text-xs px-3 py-1"
                          >
                            {cancelling === res.id ? <Spinner size="sm" /> : 'Xác nhận hủy'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Không
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(res.id)}
                          className="btn-secondary text-xs px-3 py-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Hủy đặt trước
                        </button>
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
