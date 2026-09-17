// C4 - Nhận trả sách + phát sinh phiếu phạt
import React, { useState, useRef } from 'react';
import { returnBook, payFine } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

function formatVND(n) { return Number(n).toLocaleString('vi-VN') + ' VNĐ'; }

export default function ReturnPage() {
  const toast = useToast();
  const inputRef = useRef(null);

  const [maBanSao, setMaBanSao] = useState('');
  const [tinhTrang, setTinhTrang] = useState('ok');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payingFine, setPayingFine] = useState(false);

  async function handleReturn(e) {
    e.preventDefault();
    if (!maBanSao.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await returnBook({ maBanSao: maBanSao.trim(), tinhTrang });
      setResult(res);
      if (res.data?.isLate) {
        toast.info('Trả trễ hạn — đã tạo phiếu phạt.');
      } else {
        toast.success('Nhận trả sách thành công!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayFine(fineId) {
    setPayingFine(true);
    try {
      await payFine(fineId);
      toast.success('Thu phạt thành công!');
      // Đánh dấu đã thanh toán
      setResult((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          fine: { ...prev.data.fine, trang_thai_thanh_toan: 'da_thanh_toan' },
        },
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPayingFine(false);
    }
  }

  function handleReset() {
    setMaBanSao('');
    setTinhTrang('ok');
    setResult(null);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const loan = result?.data?.loan;
  const fine = result?.data?.fine;
  const nextRes = result?.data?.nextReservation;

  return (
    <StaffLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhận trả tài liệu <span className="text-sm font-normal text-gray-400">(C4)</span></h1>

        {/* Input */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Quét mã vạch bản sao</h2>
          <form onSubmit={handleReturn} className="space-y-4">
            <input
              ref={inputRef}
              className="input font-mono text-lg"
              placeholder="Mã bản sao (VD: BS000001)"
              value={maBanSao}
              onChange={(e) => setMaBanSao(e.target.value)}
              autoFocus
            />

            {/* C4-Exc2: tình trạng khi trả */}
            <div className="flex gap-3">
              {[
                { val: 'ok', label: '✅ Nguyên vẹn', color: 'border-green-400 bg-green-50 text-green-700' },
                { val: 'hong', label: '⚠️ Hư hỏng', color: 'border-orange-400 bg-orange-50 text-orange-700' },
              ].map(({ val, label, color }) => (
                <label
                  key={val}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                    tinhTrang === val ? color : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={val}
                    checked={tinhTrang === val}
                    onChange={() => setTinhTrang(val)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5"
              disabled={loading || !maBanSao.trim()}
            >
              {loading ? <><Spinner size="sm" className="mr-2" />Đang xử lý...</> : 'Xác nhận trả'}
            </button>
          </form>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Kết quả */}
        {result && loan && (
          <div className="space-y-4">
            {/* Thông tin phiếu mượn */}
            <div className={`card border-l-4 ${fine ? 'border-l-orange-500' : 'border-l-green-500'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{fine ? '⚠️' : '✅'}</span>
                <h2 className="font-semibold text-gray-900">
                  {fine ? 'Trả trễ hạn — có phiếu phạt' : 'Trả đúng hạn'}
                </h2>
                <StatusBadge status={loan.trang_thai} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Bạn đọc</p><p className="font-medium">{loan.banDoc?.ho_ten}</p></div>
                <div><p className="text-xs text-gray-400">Mã phiếu</p><p className="font-mono text-xs">{loan.ma_phieu_muon}</p></div>
                <div><p className="text-xs text-gray-400">Ngày mượn</p><p>{loan.ngay_muon}</p></div>
                <div><p className="text-xs text-gray-400">Hạn trả</p><p className={fine ? 'text-red-600 font-medium' : ''}>{loan.ngay_hen_tra}</p></div>
              </div>
            </div>

            {/* Phiếu phạt */}
            {fine && (
              <div className="card bg-orange-50 border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3">💰 Phiếu phạt trả trễ</h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><p className="text-xs text-gray-500">Số ngày trễ</p><p className="text-orange-700 font-bold">{fine.so_ngay_tre} ngày</p></div>
                  <div><p className="text-xs text-gray-500">Số tiền phạt</p><p className="text-orange-700 font-bold text-lg">{formatVND(fine.so_tien)}</p></div>
                  <div><p className="text-xs text-gray-500">Mã phiếu phạt</p><p className="font-mono text-xs">{fine.ma_phieu_phat}</p></div>
                  <div><p className="text-xs text-gray-500">Trạng thái</p><StatusBadge status={fine.trang_thai_thanh_toan} /></div>
                </div>
                {fine.trang_thai_thanh_toan === 'chua_thanh_toan' && (
                  <button
                    onClick={() => handlePayFine(fine.id)}
                    disabled={payingFine}
                    className="btn-primary bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    {payingFine ? <Spinner size="sm" /> : `Thu ngay ${formatVND(fine.so_tien)}`}
                  </button>
                )}
              </div>
            )}

            {/* C4 bước 5: thông báo hàng đợi */}
            {nextRes && (
              <div className="card bg-blue-50 border-blue-200">
                <p className="font-medium text-blue-800 text-sm">
                  📢 Bản sao đã được giữ cho bạn đọc đặt trước tiếp theo.
                  Thông báo đã được ghi nhận.
                </p>
              </div>
            )}

            <button onClick={handleReset} className="btn-secondary w-full">
              Xử lý bản sao tiếp theo →
            </button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
