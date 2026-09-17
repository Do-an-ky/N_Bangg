// C1 chi tiết + C2 Đặt trước / Đặt mượn online
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBookDetail, createReservation } from '../../api/books';
import { useAuth } from '../../store/AuthContext';
import MemberLayout from '../../components/layout/MemberLayout';
import BookCover from '../../components/ui/BookCover';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { IconCalendar, IconChevronRight, IconBookOpen, IconUsers } from '../../components/ui/Icons';

const LOAI_MAP = { sach: 'Sách', bao: 'Báo', tap_chi: 'Tạp chí', luan_van: 'Luận văn', khac: 'Khác' };

function StepDot({ n, label, done }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? 'bg-primary-800 border-primary-800 text-white' : 'bg-white border-parchment-300 text-gray-400'}`}>
        {n}
      </div>
      <span className="text-[10px] text-gray-400 max-w-16 leading-tight">{label}</span>
    </div>
  );
}

function BorrowSteps() {
  return (
    <div className="flex items-start gap-2 mt-4 px-1">
      <StepDot n="1" label="Đặt mượn online" done />
      <div className="flex-1 h-px bg-parchment-300 mt-3.5" />
      <StepDot n="2" label="Chờ xác nhận" done={false} />
      <div className="flex-1 h-px bg-parchment-300 mt-3.5" />
      <StepDot n="3" label="Đến lấy sách" done={false} />
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [confirming, setConfirming] = useState(false); // inline confirm step
  const [reserved, setReserved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getBookDetail(id)
      .then((res) => setBook(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MemberLayout><div className="flex justify-center py-24"><Spinner size="lg" /></div></MemberLayout>;
  if (error) return <MemberLayout><div className="card text-red-600 text-center py-12">⚠️ {error}</div></MemberLayout>;
  if (!book) return null;

  const copies = book.banSao || [];
  const activeCopies = copies.filter((c) => c.trang_thai !== 'da_thanh_ly');
  const sanSangCount = copies.filter((c) => c.trang_thai === 'san_sang').length;
  const isActive = book.trang_thai === 'hoat_dong';
  const canBorrow = sanSangCount > 0 && isActive;
  const canWaitlist = sanSangCount === 0 && isActive;

  async function handleReserve() {
    if (!user) { navigate('/login'); return; }
    setReserving(true);
    setConfirming(false);
    try {
      await createReservation(book.id);
      setReserved(true);
      toast.success(canBorrow
        ? 'Đặt mượn thành công! Chúng tôi sẽ giữ sách trong 3 ngày.'
        : 'Đã vào danh sách chờ! Bạn sẽ được thông báo khi sách có sẵn.');
      const res = await getBookDetail(id);
      setBook(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReserving(false);
    }
  }

  return (
    <MemberLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 flex items-center gap-1.5">
          <Link to="/member/search" className="hover:text-primary-600 transition-colors">Tra cứu</Link>
          <span>›</span>
          <span className="text-primary-900 truncate max-w-xs font-medium">{book.nhan_de}</span>
        </nav>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-parchment-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-0">
            {/* Left — book cover */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 p-8 flex flex-col items-center justify-center min-w-[200px]">
              <div className="drop-shadow-2xl">
                <BookCover title={book.nhan_de} author={book.tac_gia} size="lg" />
              </div>
              {/* Availability badge below cover */}
              {sanSangCount > 0 ? (
                <span className="mt-5 inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {sanSangCount} bản sao có sẵn
                </span>
              ) : isActive ? (
                <span className="mt-5 inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Đang được mượn hết
                </span>
              ) : (
                <span className="mt-5 inline-flex items-center gap-1.5 bg-gray-500/20 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                  Không lưu thông
                </span>
              )}
            </div>

            {/* Right — info */}
            <div className="p-6 md:p-8 space-y-5">
              {/* Type + title */}
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-600 bg-gold-100 border border-gold-200 px-2.5 py-0.5 rounded-full mb-3">
                  {LOAI_MAP[book.loai_tai_lieu] || book.loai_tai_lieu}
                </span>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-900 leading-tight">
                  {book.nhan_de}
                </h1>
                <p className="text-gray-500 mt-1.5">{book.tac_gia}</p>
              </div>

              {/* Metadata */}
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm border-t border-parchment-100 pt-4">
                {book.nha_xuat_ban && (
                  <><dt className="text-gray-400 font-medium">Nhà xuất bản</dt><dd className="text-gray-700">{book.nha_xuat_ban}</dd></>
                )}
                {book.nam_xuat_ban && (
                  <><dt className="text-gray-400 font-medium">Năm xuất bản</dt><dd className="text-gray-700">{book.nam_xuat_ban}</dd></>
                )}
                {book.isbn && (
                  <><dt className="text-gray-400 font-medium">ISBN</dt><dd className="text-gray-700 font-mono text-xs">{book.isbn}</dd></>
                )}
                {book.the_loai && (
                  <><dt className="text-gray-400 font-medium">Thể loại</dt><dd className="text-gray-700">{book.the_loai}</dd></>
                )}
                {book.soNguoiDatTruoc > 0 && (
                  <><dt className="text-gray-400 font-medium">Đang chờ</dt><dd className="text-orange-600 font-semibold">{book.soNguoiDatTruoc} người</dd></>
                )}
              </dl>

              {book.mo_ta && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-parchment-100 pt-4">
                  {book.mo_ta}
                </p>
              )}

              {/* ─── CTA section ─── */}
              <div className="border-t border-parchment-100 pt-5">
                {reserved ? (
                  /* ✅ Success state */
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="font-semibold text-green-800 mb-1">
                      {canBorrow ? '✓ Đặt mượn thành công!' : '✓ Đã vào danh sách chờ!'}
                    </p>
                    <p className="text-sm text-green-700">
                      {canBorrow
                        ? 'Chúng tôi sẽ giữ sách tối đa 3 ngày. Vui lòng đến quầy thủ thư để hoàn tất thủ tục mượn.'
                        : 'Bạn sẽ nhận được thông báo qua email khi sách được trả về và đến lượt bạn.'}
                    </p>
                  </div>

                ) : canBorrow ? (
                  /* 📗 Book is available — show "Đặt mượn ngay" */
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <IconBookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800 text-sm">Sách đang có sẵn!</p>
                        <p className="text-xs text-green-700 mt-0.5">Đặt mượn ngay để chúng tôi chuẩn bị sách cho bạn.</p>
                      </div>
                    </div>

                    {!confirming ? (
                      <button
                        onClick={() => setConfirming(true)}
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <IconCalendar className="w-4 h-4" />
                        Đặt mượn ngay
                        <IconChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="bg-parchment-50 border border-parchment-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-medium text-primary-900">Xác nhận đặt mượn?</p>
                        <p className="text-xs text-gray-500">
                          Chúng tôi sẽ giữ sách trong <strong className="text-primary-800">3 ngày</strong>. Vui lòng đến quầy thủ thư để lấy sách và xuất trình thẻ bạn đọc.
                        </p>
                        <BorrowSteps />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleReserve}
                            disabled={reserving}
                            className="flex-1 bg-primary-800 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {reserving ? <Spinner size="sm" /> : 'Xác nhận'}
                          </button>
                          <button
                            onClick={() => setConfirming(false)}
                            className="flex-1 border border-parchment-300 text-gray-600 hover:bg-parchment-50 py-2.5 rounded-lg text-sm transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                      <IconCalendar className="w-3.5 h-3.5" />
                      Sách sẽ được giữ 3 ngày sau khi đặt
                    </p>
                  </div>

                ) : canWaitlist ? (
                  /* 📙 Book not available — show waitlist */
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <IconUsers className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-orange-800 text-sm">Sách đang được mượn hết</p>
                        <p className="text-xs text-orange-700 mt-0.5">
                          {book.soNguoiDatTruoc > 0
                            ? `Hiện có ${book.soNguoiDatTruoc} người đang chờ. Vào danh sách để được ưu tiên.`
                            : 'Đăng ký vào danh sách chờ để được thông báo sớm nhất.'}
                        </p>
                      </div>
                    </div>

                    {!confirming ? (
                      <button
                        onClick={() => setConfirming(true)}
                        className="w-full border-2 border-primary-800 text-primary-800 hover:bg-primary-800 hover:text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        Vào danh sách chờ
                      </button>
                    ) : (
                      <div className="bg-parchment-50 border border-parchment-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-medium text-primary-900">Xác nhận vào danh sách chờ?</p>
                        <p className="text-xs text-gray-500">
                          Khi sách được trả về, bạn sẽ được thông báo theo thứ tự đăng ký. Hạn lấy sách là <strong>3 ngày</strong> sau thông báo.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleReserve}
                            disabled={reserving}
                            className="flex-1 bg-primary-800 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {reserving ? <Spinner size="sm" /> : 'Xác nhận'}
                          </button>
                          <button
                            onClick={() => setConfirming(false)}
                            className="flex-1 border border-parchment-300 text-gray-600 hover:bg-parchment-50 py-2.5 rounded-lg text-sm transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : (
                  /* 🔒 Not active */
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-500 text-sm text-center">
                    Tài liệu này hiện không trong diện lưu thông.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copies table */}
        {activeCopies.length > 0 && (
          <div className="bg-white rounded-2xl border border-parchment-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-parchment-100 flex items-center gap-2">
              <h2 className="font-semibold text-primary-900">Danh sách bản sao</h2>
              <span className="text-xs text-gray-400">({activeCopies.length} bản)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-classic">
                <thead>
                  <tr>
                    <th>Mã bản sao</th>
                    <th>Vị trí kệ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCopies.map((c) => (
                    <tr key={c.id} className="hover:bg-parchment-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.ma_ban_sao}</td>
                      <td className="px-4 py-3 text-gray-600">{c.vi_tri_ke || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.trang_thai} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
