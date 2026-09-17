// B2/B3/B4: Chi tiết + hành động thẻ bạn đọc + D3 công nợ
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMember, getMemberDebt, getMemberLoans, renewMemberCard, lockMemberCard, unlockMemberCard, cancelMemberCard } from '../../api/staff';
import { useAuth } from '../../store/AuthContext';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const HANG_MUC = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', ngoai: 'Ngoài trường' };

export default function MemberDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [debt, setDebt] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [showLockForm, setShowLockForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canManage = ['quan_ly', 'admin'].includes(user?.role);

  async function loadAll() {
    setLoading(true);
    try {
      const [mRes, dRes, lRes] = await Promise.all([
        getMember(id),
        getMemberDebt(id),
        getMemberLoans(id, 'dang_muon'),
      ]);
      setMember(mRes.data);
      setDebt(dRes.data);
      setLoans(lRes.data);
    } catch (err) {
      toast.error(err.message);
      navigate('/staff/members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id]);

  async function doAction(action, fn) {
    setActionLoading(action);
    try {
      await fn();
      toast.success('Thao tác thành công!');
      await loadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading('');
    }
  }

  if (loading) return <StaffLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></StaffLayout>;
  if (!member) return null;

  const today = new Date().toISOString().split('T')[0];
  const hasOverdue = loans.some((l) => l.ngay_hen_tra < today);
  const hasDebt = debt?.total > 0;

  return (
    <StaffLayout>
      <div className="max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex gap-2">
          <Link to="/staff/members" className="hover:text-primary-600">Bạn đọc</Link>
          <span>›</span>
          <span className="text-gray-900">{member.ho_ten}</span>
        </nav>

        {/* Card thẻ */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">Thẻ bạn đọc</p>
              <p className="text-2xl font-bold font-mono mt-1">{member.ma_the}</p>
              <p className="text-xl mt-1">{member.ho_ten}</p>
              <p className="text-blue-200 text-sm mt-1">{HANG_MUC[member.hang_muc]}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={member.trang_thai_the} />
              <p className="text-xs text-blue-200 mt-2">Hết hạn: {member.ngay_het_han}</p>
            </div>
          </div>
        </div>

        {/* Cảnh báo */}
        {(hasOverdue || hasDebt) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            {hasOverdue && <p className="text-sm text-red-700">⚠️ Có sách đang mượn quá hạn.</p>}
            {hasDebt && <p className="text-sm text-red-700">⚠️ Công nợ chưa thanh toán: {Number(debt.total).toLocaleString('vi-VN')} VNĐ.</p>}
          </div>
        )}

        {/* Thông tin cá nhân */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ['Email', member.email], ['Điện thoại', member.so_dien_thoai],
              ['Địa chỉ', member.dia_chi], ['Đơn vị', member.don_vi],
              ['CMND/CCCD', member.so_cmnd], ['Mã sinh viên', member.ma_sinh_vien],
              ['Ngày đăng ký', member.ngay_dang_ky],
            ].map(([label, val]) => val && (
              <div key={label}>
                <dt className="text-gray-400 text-xs">{label}</dt>
                <dd className="text-gray-900">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hành động thẻ */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quản lý thẻ</h2>
          <div className="flex flex-wrap gap-3">

            {/* B2: Gia hạn */}
            <button
              onClick={() => doAction('renew', () => renewMemberCard(id))}
              disabled={!!actionLoading || hasDebt || hasOverdue}
              className="btn-secondary"
              title={hasDebt || hasOverdue ? 'Không thể gia hạn khi còn nợ hoặc sách quá hạn' : 'Gia hạn thẻ bạn đọc'}
            >
              {actionLoading === 'renew' ? <Spinner size="sm" /> : '🔄 Gia hạn thẻ (B2)'}
            </button>

            {/* B3-Alt1: Khóa / Mở khóa */}
            {member.trang_thai_the !== 'bi_khoa' ? (
              !showLockForm ? (
                <button
                  onClick={() => setShowLockForm(true)}
                  disabled={!!actionLoading}
                  className="btn-secondary text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  🔒 Khóa thẻ (B3)
                </button>
              ) : (
                <div className="w-full flex gap-3">
                  <input
                    className="input flex-1"
                    placeholder="Lý do khóa thẻ (tối thiểu 5 ký tự)"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (lockReason.length < 5) { toast.error('Lý do khóa phải tối thiểu 5 ký tự'); return; } doAction('lock', () => lockMemberCard(id, lockReason)); setShowLockForm(false); setLockReason(''); }}
                    disabled={!!actionLoading}
                    className="btn-danger px-4"
                  >
                    {actionLoading === 'lock' ? <Spinner size="sm" /> : 'Xác nhận khóa'}
                  </button>
                  <button onClick={() => setShowLockForm(false)} className="btn-secondary px-4">Hủy</button>
                </div>
              )
            ) : (
              canManage && (
                <button
                  onClick={() => doAction('unlock', () => unlockMemberCard(id))}
                  disabled={!!actionLoading}
                  className="btn-secondary text-green-600 border-green-300 hover:bg-green-50"
                >
                  {actionLoading === 'unlock' ? <Spinner size="sm" /> : '🔓 Mở khóa thẻ'}
                </button>
              )
            )}

            {/* B4: Hủy thẻ (quan_ly+) */}
            {canManage && member.trang_thai_the !== 'da_huy' && (
              !showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={!!actionLoading || loans.length > 0 || hasDebt}
                  className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
                  title={loans.length > 0 || hasDebt ? 'Không thể hủy khi còn sách mượn hoặc nợ' : ''}
                >
                  ❌ Hủy thẻ (B4)
                </button>
              ) : (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700">Xác nhận hủy thẻ bạn đọc <strong>{member.ho_ten}</strong>? Hành động này không thể hoàn tác.</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { doAction('cancel', () => cancelMemberCard(id)); setShowCancelConfirm(false); navigate('/staff/members'); }} className="btn-danger text-xs">Hủy thẻ</button>
                    <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary text-xs">Không</button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sách đang mượn */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Sách đang mượn ({loans.length})</h2>
          {loans.length === 0 ? (
            <p className="text-gray-400 text-sm">Không có tài liệu đang mượn.</p>
          ) : (
            <div className="space-y-2">
              {loans.map((l) => (
                <div key={l.id} className={`flex items-center justify-between p-3 rounded-lg border ${l.ngay_hen_tra < today ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.banSao?.taiLieu?.nhan_de}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{l.banSao?.ma_ban_sao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className={l.ngay_hen_tra < today ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                      Hạn: {l.ngay_hen_tra}{l.ngay_hen_tra < today ? ' ⚠️' : ''}
                    </p>
                    <StatusBadge status={l.trang_thai} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Công nợ */}
        {debt && debt.fines.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Công nợ — {Number(debt.total).toLocaleString('vi-VN')} VNĐ</h2>
            {debt.fines.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <span className="text-gray-700">{f.ma_phieu_phat} — {f.loai_phat}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-orange-700">{Number(f.so_tien).toLocaleString('vi-VN')} VNĐ</span>
                  <StatusBadge status={f.trang_thai_thanh_toan} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
