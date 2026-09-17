// A1-A4: Quản lý tài liệu
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listDocuments, createDocument } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import BookCover from '../../components/ui/BookCover';

const LOAI_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'sach', label: 'Sách' },
  { value: 'bao', label: 'Báo' },
  { value: 'tap_chi', label: 'Tạp chí' },
  { value: 'luan_van', label: 'Luận văn' },
  { value: 'khac', label: 'Khác' },
];
const LOAI_LABEL = { sach: 'Sách', bao: 'Báo', tap_chi: 'Tạp chí', luan_van: 'Luận văn', khac: 'Khác' };

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'cho_bien_muc', label: 'Chờ biên mục' },
  { value: 'hoat_dong', label: 'Hoạt động' },
  { value: 'ngung_luu_hanh', label: 'Ngừng lưu hành' },
];

function AddDocModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ nhanDe: '', tacGia: '', loaiTaiLieu: 'sach', isbn: '', namXuatBan: '', nhaXuatBan: '', moTa: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(f) { return (e) => setForm((p) => ({ ...p, [f]: e.target.value })); }

  function validate() {
    const errs = {};
    if (!form.nhanDe.trim()) errs.nhanDe = 'Nhan đề không được để trống.';
    if (!form.tacGia.trim()) errs.tacGia = 'Tác giả không được để trống.';
    const year = parseInt(form.namXuatBan);
    if (form.namXuatBan && (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1)) errs.namXuatBan = 'Năm xuất bản không hợp lệ.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await createDocument({
        nhanDe: form.nhanDe.trim(),
        tacGia: form.tacGia.trim(),
        loaiTaiLieu: form.loaiTaiLieu,
        isbn: form.isbn.trim() || undefined,
        namXuatBan: form.namXuatBan ? parseInt(form.namXuatBan) : undefined,
        nhaXuatBan: form.nhaXuatBan.trim() || undefined,
        moTa: form.moTa.trim() || undefined,
      });
      toast.success('Đã tạo tài liệu! Trạng thái: Chờ biên mục.');
      onCreated(res.data?.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function Field({ label, req, name, type = 'text', placeholder }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label} {req && <span className="text-red-500">*</span>}</label>
        <input className={`input ${errors[name] ? 'border-red-400' : ''}`} type={type} value={form[name]} onChange={set(name)} placeholder={placeholder} />
        {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">Thêm tài liệu mới <span className="text-gray-400 text-sm font-normal">(A1)</span></h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nhan đề" req name="nhanDe" placeholder="Lập trình Python cơ bản" />
          <Field label="Tác giả" req name="tacGia" placeholder="Nguyễn Văn A, Trần Thị B" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài liệu <span className="text-red-500">*</span></label>
            <select className="input" value={form.loaiTaiLieu} onChange={set('loaiTaiLieu')}>
              {LOAI_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ISBN" name="isbn" placeholder="978-3-16-148410-0" />
            <Field label="Năm xuất bản" name="namXuatBan" type="number" placeholder="2023" />
          </div>
          <Field label="Nhà xuất bản" name="nhaXuatBan" placeholder="NXB Giáo Dục" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea className="input resize-none" rows={2} value={form.moTa} onChange={set('moTa')} placeholder="Mô tả ngắn về tài liệu..." />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Tạo tài liệu'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loai, setLoai] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();

  const fetchDocs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await listDocuments({ search: search || undefined, loaiTaiLieu: loai || undefined, trangThai: trangThai || undefined, page: p, limit: 20 });
      setDocs(res.data);
      setTotal(res.pagination?.total || res.data.length);
      setPage(p);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, loai, trangThai]);

  React.useEffect(() => { fetchDocs(1); }, []);

  const totalPages = Math.ceil(total / 20);

  function handleCreated(id) {
    setShowAdd(false);
    if (id) navigate(`/staff/documents/${id}`);
    else fetchDocs(page);
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tài liệu <span className="text-sm font-normal text-gray-400">(A1–A4)</span></h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Thêm tài liệu</button>
        </div>

        {/* Filter */}
        <form onSubmit={(e) => { e.preventDefault(); fetchDocs(1); }} className="card p-4 flex flex-wrap gap-3">
          <input className="input flex-1 min-w-48" placeholder="Nhan đề, tác giả, ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-40" value={loai} onChange={(e) => setLoai(e.target.value)}>
            {LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input w-44" value={trangThai} onChange={(e) => setTrangThai(e.target.value)}>
            {TRANG_THAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit" className="btn-primary px-6" disabled={loading}>Tìm</button>
        </form>

        {!loading && <p className="text-sm text-gray-500">Tổng: {total} tài liệu</p>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : docs.length === 0 ? (
          <EmptyState icon="📚" title="Không tìm thấy tài liệu" />
        ) : (
          <div className="bg-white rounded-xl border border-parchment-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-classic">
                <thead>
                  <tr>
                    {['Mã', 'Nhan đề / Tác giả', 'Tác giả', 'Loại', 'Số bản sao', 'Trạng thái', ''].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-parchment-50 cursor-pointer transition-colors" onClick={() => navigate(`/staff/documents/${d.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{d.ma_tai_lieu}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BookCover title={d.nhan_de} author={d.tac_gia} size="sm" className="shrink-0" />
                          <div>
                            <p className="font-medium text-primary-900 max-w-48 truncate">{d.nhan_de}</p>
                            {d.isbn && <p className="text-xs text-gray-400 mt-0.5">ISBN: {d.isbn}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-32 truncate">{d.tac_gia}</td>
                      <td className="px-4 py-3 text-gray-500">{LOAI_LABEL[d.loai_tai_lieu] || d.loai_tai_lieu}</td>
                      <td className="px-4 py-3 text-center font-medium text-primary-700">{d.banSao?.length ?? d.so_ban_sao ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.trang_thai} /></td>
                      <td className="px-4 py-3">
                        <Link to={`/staff/documents/${d.id}`} className="text-gold-600 hover:text-gold-500 text-xs font-semibold" onClick={(e) => e.stopPropagation()}>
                          Chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button className="btn-secondary px-3" onClick={() => fetchDocs(page - 1)} disabled={page <= 1 || loading}>← Trước</button>
            <span className="flex items-center text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <button className="btn-secondary px-3" onClick={() => fetchDocs(page + 1)} disabled={page >= totalPages || loading}>Tiếp →</button>
          </div>
        )}
      </div>

      {showAdd && <AddDocModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
    </StaffLayout>
  );
}
