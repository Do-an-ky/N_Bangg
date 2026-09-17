// F1-F4: Báo cáo thống kê
import React, { useState, useEffect } from 'react';
import { getLoanStats, getDocumentStats, getMemberStats } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const TABS = [
  { key: 'loans', label: 'F1 — Lượt mượn' },
  { key: 'documents', label: 'F2 — Tài liệu' },
  { key: 'members', label: 'F3 — Bạn đọc' },
];

function StatNum({ label, value, color = 'text-gray-900', sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className={`text-3xl font-bold font-variant-numeric tabular-nums mt-1 ${color}`}>{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// F1: Lưu thông
function LoanStats() {
  const toast = useToast();
  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getLoanStats({ dateFrom: from, dateTo: to });
      setData(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
          <input type="date" className="input w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
          <input type="date" className="input w-44" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={load} disabled={loading} className="btn-primary px-6">
          {loading ? <Spinner size="sm" /> : 'Lọc'}
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-3xl font-bold text-primary-700">{data.tongMuon ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Tổng lượt mượn</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-3xl font-bold text-green-700">{data.tongTra ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Đã trả</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-3xl font-bold text-red-600">{data.tongTraTre ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Trả trễ hạn</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-3xl font-bold text-orange-600">{Number(data.tongPhat || 0).toLocaleString('vi-VN')} VNĐ</p>
              <p className="text-sm text-gray-500 mt-1">Tổng tiền phạt</p>
            </div>
          </div>

          {/* Top tài liệu được mượn nhiều */}
          {data.topDocuments?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Top tài liệu được mượn nhiều nhất</h3>
              <div className="space-y-2">
                {data.topDocuments.map((d, i) => (
                  <div key={d.taiLieuId || i} className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-bold text-gray-400">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-sm">{d.nhanDe}</p>
                        <p className="text-sm font-bold text-primary-700 ml-2 shrink-0">{d.soLuot} lượt</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full"
                          style={{ width: `${(d.soLuot / (data.topDocuments[0]?.soLuot || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// F2: Tài liệu
function DocStats() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocumentStats().then((res) => setData(res.data)).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Tổng tài liệu', value: data.totals?.taiLieu, color: 'text-primary-700' },
          { label: 'Tổng bản sao', value: data.totals?.banSao, color: 'text-gray-900' },
          { label: 'Đang mượn', value: data.copyByStatus?.dang_muon, color: 'text-blue-700' },
          { label: 'Sẵn sàng', value: data.copyByStatus?.san_sang, color: 'text-green-700' },
          { label: 'Chờ biên mục', value: data.docByStatus?.cho_bien_muc, color: 'text-amber-700' },
          { label: 'Ngừng lưu hành', value: data.docByStatus?.ngung_luu_hanh, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tài liệu theo loại */}
      {data.docByType && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Phân loại tài liệu</h3>
          <div className="space-y-2">
            {Object.entries(data.docByType).map(([loai, count]) => {
              const LOAI = { sach: 'Sách', bao: 'Báo', tap_chi: 'Tạp chí', luan_van: 'Luận văn', khac: 'Khác' };
              const total = Object.values(data.docByType).reduce((a, b) => a + b, 0);
              return (
                <div key={loai} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-600">{LOAI[loai] || loai}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// F3: Bạn đọc
function MemberStats() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberStats().then((res) => setData(res.data)).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Thẻ hoạt động', value: data.byStatus?.hoat_dong, color: 'text-green-700' },
          { label: 'Thẻ bị khóa', value: data.byStatus?.bi_khoa, color: 'text-red-600' },
          { label: 'Hết hạn', value: data.byStatus?.het_han, color: 'text-amber-700' },
          { label: 'Sắp hết hạn (30 ngày)', value: data.sapHetHan, color: 'text-orange-700' },
          { label: 'Đang có sách quá hạn', value: data.coSachQuaHan, color: 'text-red-700' },
          { label: 'Đăng ký mới tháng này', value: data.dangKyMoi, color: 'text-primary-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Theo hạng mục */}
      {data.byCategory && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Bạn đọc theo hạng mục</h3>
          <div className="space-y-2">
            {Object.entries(data.byCategory).map(([cat, count]) => {
              const LABEL = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên/CB', ngoai: 'Ngoài trường' };
              const total = Object.values(data.byCategory).reduce((a, b) => a + b, 0);
              return (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-600">{LABEL[cat] || cat}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('loans');

  return (
    <StaffLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo thống kê <span className="text-sm font-normal text-gray-400">(F1–F4)</span></h1>

        {/* Tab nav */}
        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'loans' && <LoanStats />}
        {tab === 'documents' && <DocStats />}
        {tab === 'members' && <MemberStats />}
      </div>
    </StaffLayout>
  );
}
