// A2: Biên mục, A3: Cập nhật, A4: Thanh lý bản sao
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDocument, catalogDocument, updateDocument,
  getCopies, addCopies, discardCopy, stopCirculation,
} from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const LOAI_LABEL = { sach: 'Sách', bao: 'Báo', tap_chi: 'Tạp chí', luan_van: 'Luận văn', khac: 'Khác' };
const LOAI_TL = ['sach', 'bao', 'tap_chi', 'luan_van', 'khac'];

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [doc, setDoc] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // A2 catalog form
  const [catalogForm, setCatalogForm] = useState({ viTriKho: '', maDDC: '', tuKhoa: '' });
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Add copies
  const [addCount, setAddCount] = useState(1);
  const [addLoading, setAddLoading] = useState(false);

  // Discard copy
  const [discardTarget, setDiscardTarget] = useState(null);
  const [discardReason, setDiscardReason] = useState('');
  const [discardLoading, setDiscardLoading] = useState(false);

  async function loadDoc() {
    try {
      const [dRes, cRes] = await Promise.all([getDocument(id), getCopies(id)]);
      setDoc(dRes.data);
      setCopies(cRes.data || []);
      setEditForm({
        nhanDe: dRes.data.nhan_de, tacGia: dRes.data.tac_gia,
        isbn: dRes.data.isbn || '', nhaXuatBan: dRes.data.nha_xuat_ban || '',
        namXuatBan: dRes.data.nam_xuat_ban || '', moTa: dRes.data.mo_ta || '',
        loaiTaiLieu: dRes.data.loai_tai_lieu,
      });
    } catch (err) {
      toast.error(err.message);
      navigate('/staff/documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDoc(); }, [id]);

  function setEdit(f) { return (e) => setEditForm((p) => ({ ...p, [f]: e.target.value })); }

  function validateEdit() {
    const errs = {};
    if (!editForm.nhanDe?.trim()) errs.nhanDe = 'Nhan đề là bắt buộc.';
    if (!editForm.tacGia?.trim()) errs.tacGia = 'Tác giả là bắt buộc.';
    return errs;
  }

  async function handleSaveEdit() {
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateDocument(id, {
        nhanDe: editForm.nhanDe.trim(), tacGia: editForm.tacGia.trim(),
        isbn: editForm.isbn || undefined, nhaXuatBan: editForm.nhaXuatBan || undefined,
        namXuatBan: editForm.namXuatBan ? parseInt(editForm.namXuatBan) : undefined,
        moTa: editForm.moTa || undefined, loaiTaiLieu: editForm.loaiTaiLieu,
      });
      toast.success('Cập nhật tài liệu thành công!');
      setEditMode(false);
      loadDoc();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCatalog(e) {
    e.preventDefault();
    if (!catalogForm.viTriKho.trim()) { toast.error('Vị trí kho là bắt buộc để biên mục.'); return; }
    setCatalogLoading(true);
    try {
      await catalogDocument(id, {
        viTriKho: catalogForm.viTriKho.trim(),
        maDDC: catalogForm.maDDC.trim() || undefined,
        tuKhoa: catalogForm.tuKhoa.trim() || undefined,
      });
      toast.success('Biên mục thành công! Tài liệu đã hoạt động.');
      loadDoc();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCatalogLoading(false);
    }
  }

  async function handleAddCopies() {
    if (addCount < 1) return;
    setAddLoading(true);
    try {
      await addCopies(id, Array(addCount).fill({}));
      toast.success(`Đã thêm ${addCount} bản sao!`);
      setAddCount(1);
      loadDoc();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDiscard() {
    if (!discardReason.trim() || discardReason.length < 5) { toast.error('Lý do thanh lý tối thiểu 5 ký tự.'); return; }
    setDiscardLoading(true);
    try {
      await discardCopy(id, discardTarget.id, discardReason.trim());
      toast.success('Đã thanh lý bản sao!');
      setDiscardTarget(null);
      setDiscardReason('');
      loadDoc();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDiscardLoading(false);
    }
  }

  async function handleStop() {
    if (!window.confirm('Ngừng lưu hành tài liệu? Tất cả bản sao sẽ không thể mượn tiếp.')) return;
    try {
      await stopCirculation(id);
      toast.info('Đã ngừng lưu hành.');
      loadDoc();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <StaffLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></StaffLayout>;
  if (!doc) return null;

  const canCatalog = ['cho_bien_muc', 'cho_bo_sung_thong_tin'].includes(doc.trang_thai);
  const isActive = doc.trang_thai === 'hoat_dong';

  return (
    <StaffLayout>
      <div className="max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex gap-2">
          <Link to="/staff/documents" className="hover:text-primary-600">Tài liệu</Link>
          <span>›</span>
          <span className="text-gray-900 truncate max-w-xs">{doc.nhan_de}</span>
        </nav>

        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{doc.ma_tai_lieu}</p>
              {editMode ? (
                <input className={`input text-xl font-bold mb-2 ${editErrors.nhanDe ? 'border-red-400' : ''}`} value={editForm.nhanDe} onChange={setEdit('nhanDe')} />
              ) : (
                <h1 className="text-xl font-bold text-gray-900">{doc.nhan_de}</h1>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={doc.trang_thai} />
              {isActive && !editMode && (
                <button onClick={handleStop} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">Ngừng LH</button>
              )}
            </div>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Tác giả *</label>
                  <input className={`input ${editErrors.tacGia ? 'border-red-400' : ''}`} value={editForm.tacGia} onChange={setEdit('tacGia')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Loại tài liệu</label>
                  <select className="input" value={editForm.loaiTaiLieu} onChange={setEdit('loaiTaiLieu')}>
                    {LOAI_TL.map((l) => <option key={l} value={l}>{LOAI_LABEL[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">ISBN</label>
                  <input className="input" value={editForm.isbn} onChange={setEdit('isbn')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Năm xuất bản</label>
                  <input className="input" type="number" value={editForm.namXuatBan} onChange={setEdit('namXuatBan')} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-0.5 block">Nhà xuất bản</label>
                  <input className="input" value={editForm.nhaXuatBan} onChange={setEdit('nhaXuatBan')} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-0.5 block">Mô tả</label>
                  <textarea className="input resize-none" rows={2} value={editForm.moTa} onChange={setEdit('moTa')} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Lưu thay đổi'}</button>
                <button onClick={() => { setEditMode(false); setEditErrors({}); }} className="btn-secondary">Hủy</button>
              </div>
            </div>
          ) : (
            <div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                {[
                  ['Tác giả', doc.tac_gia], ['Loại', LOAI_LABEL[doc.loai_tai_lieu]],
                  ['ISBN', doc.isbn], ['Năm XB', doc.nam_xuat_ban],
                  ['Nhà XB', doc.nha_xuat_ban], ['Vị trí kho', doc.vi_tri_kho],
                  ['Mã DDC', doc.ma_ddc],
                ].map(([label, val]) => val && (
                  <div key={label}>
                    <dt className="text-xs text-gray-400">{label}</dt>
                    <dd className="text-gray-900">{val}</dd>
                  </div>
                ))}
              </dl>
              {doc.mo_ta && <p className="text-sm text-gray-600 italic">{doc.mo_ta}</p>}
              {/* A3: Sửa thông tin */}
              <button onClick={() => setEditMode(true)} className="mt-3 btn-secondary text-sm">✏️ Sửa thông tin (A3)</button>
            </div>
          )}
        </div>

        {/* A2: Biên mục */}
        {canCatalog && (
          <div className="card bg-amber-50 border-amber-200">
            <h2 className="font-semibold text-amber-900 mb-3">📋 Biên mục tài liệu (A2)</h2>
            <form onSubmit={handleCatalog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-0.5 block">Vị trí kho <span className="text-red-500">*</span></label>
                  <input className="input" placeholder="VD: Khu A, Tầng 2, Kệ 03" value={catalogForm.viTriKho} onChange={(e) => setCatalogForm((p) => ({ ...p, viTriKho: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-0.5 block">Mã DDC (tùy chọn)</label>
                  <input className="input" placeholder="VD: 005.133" value={catalogForm.maDDC} onChange={(e) => setCatalogForm((p) => ({ ...p, maDDC: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 mb-0.5 block">Từ khóa (tùy chọn)</label>
                  <input className="input" placeholder="lập trình, python, khoa học máy tính" value={catalogForm.tuKhoa} onChange={(e) => setCatalogForm((p) => ({ ...p, tuKhoa: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={catalogLoading} className="btn-primary">
                {catalogLoading ? <Spinner size="sm" /> : 'Biên mục & kích hoạt'}
              </button>
            </form>
          </div>
        )}

        {/* Bản sao */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Bản sao ({copies.length})</h2>
            {isActive && (
              <div className="flex items-center gap-2">
                <input type="number" className="input w-20 text-center" min={1} max={50} value={addCount} onChange={(e) => setAddCount(Math.max(1, parseInt(e.target.value) || 1))} />
                <button onClick={handleAddCopies} disabled={addLoading} className="btn-secondary text-sm">
                  {addLoading ? <Spinner size="sm" /> : '+ Thêm bản sao'}
                </button>
              </div>
            )}
          </div>

          {copies.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có bản sao nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Mã bản sao', 'Trạng thái', 'Ghi chú', 'Hành động'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {copies.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{c.ma_ban_sao}</td>
                      <td className="px-3 py-2"><StatusBadge status={c.trang_thai} /></td>
                      <td className="px-3 py-2 text-xs text-gray-500 max-w-32 truncate">{c.ghi_chu || '—'}</td>
                      <td className="px-3 py-2">
                        {/* A4: Thanh lý */}
                        {c.trang_thai === 'san_sang' && (
                          <button
                            onClick={() => setDiscardTarget(c)}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Thanh lý (A4)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Discard modal */}
      {discardTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Thanh lý bản sao (A4)</h3>
            <p className="text-sm text-gray-600">Bản sao: <span className="font-mono font-medium">{discardTarget.ma_ban_sao}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do thanh lý <span className="text-red-500">*</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                placeholder="Nhập lý do thanh lý bản sao..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleDiscard} disabled={discardLoading} className="btn-danger flex-1">
                {discardLoading ? <Spinner size="sm" /> : 'Xác nhận thanh lý'}
              </button>
              <button onClick={() => { setDiscardTarget(null); setDiscardReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
