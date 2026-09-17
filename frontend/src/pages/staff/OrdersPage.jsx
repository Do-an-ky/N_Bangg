// A5: Quản lý đơn đặt hàng (quan_ly+)
import React, { useState, useEffect, useCallback } from 'react';
import {
  listSuppliers, listOrders, createOrder, approveOrder, receiveOrder,
} from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const TABS = [
  { key: 'orders', label: 'Đơn đặt hàng' },
  { key: 'new', label: '+ Tạo đơn mới' },
  { key: 'suppliers', label: 'Nhà cung cấp' },
];

function formatVND(n) { return Number(n || 0).toLocaleString('vi-VN') + ' VNĐ'; }

// ── Danh sách đơn đặt hàng ────────────────────────────────────────────────────
function OrderList() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders();
      setOrders(res.data || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function doAction(id, action, fn) {
    setActionLoading((p) => ({ ...p, [id]: action }));
    try {
      await fn();
      toast.success('Thao tác thành công!');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoading((p) => ({ ...p, [id]: null })); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (orders.length === 0) return <EmptyState icon="🛒" title="Chưa có đơn đặt hàng nào" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Mã đơn', 'Nhà cung cấp', 'Ngày lập', 'Tổng tiền dự kiến', 'Trạng thái', 'Hành động'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => {
              const act = actionLoading[o.id];
              const tongTien = o.chiTiet?.reduce((s, c) => s + (c.so_luong_dat || 0) * (c.don_gia_du_kien || 0), 0) || 0;
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.ma_don}</td>
                  <td className="px-4 py-3 text-gray-900">{o.nhaCungCap?.ten || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{o.ngay_lap?.split('T')[0]}</td>
                  <td className="px-4 py-3 font-medium text-gray-700 tabular-nums">{formatVND(tongTien)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.trang_thai} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {o.trang_thai === 'cho_duyet' && (
                        <button
                          onClick={() => doAction(o.id, 'approve', () => approveOrder(o.id))}
                          disabled={!!act}
                          className="text-xs px-2.5 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {act === 'approve' ? <Spinner size="sm" /> : 'Duyệt'}
                        </button>
                      )}
                      {o.trang_thai === 'da_duyet' && (
                        <button
                          onClick={() => doAction(o.id, 'receive', () => receiveOrder(o.id))}
                          disabled={!!act}
                          className="text-xs px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {act === 'receive' ? <Spinner size="sm" /> : 'Nhận hàng'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tạo đơn mới ───────────────────────────────────────────────────────────────
function CreateOrderForm({ onCreated }) {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [nhaCungCapId, setNhaCungCapId] = useState('');
  const [items, setItems] = useState([{ nhanDeDuKien: '', soLuongDat: 1, donGiaDuKien: 0 }]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  useEffect(() => {
    listSuppliers().then((r) => setSuppliers(r.data || [])).finally(() => setLoadingSuppliers(false));
  }, []);

  function setItem(idx, field, value) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems((p) => [...p, { nhanDeDuKien: '', soLuongDat: 1, donGiaDuKien: 0 }]); }
  function removeItem(idx) { setItems((p) => p.filter((_, i) => i !== idx)); }

  const tongDuKien = items.reduce((s, i) => s + (Number(i.soLuongDat) || 0) * (Number(i.donGiaDuKien) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nhaCungCapId) { toast.error('Vui lòng chọn nhà cung cấp.'); return; }
    if (items.some((i) => !i.nhanDeDuKien.trim())) { toast.error('Vui lòng nhập nhan đề cho tất cả tài liệu.'); return; }
    setLoading(true);
    try {
      await createOrder({
        nhaCungCapId: parseInt(nhaCungCapId),
        chiTiet: items.map((i) => ({
          nhanDeDuKien: i.nhanDeDuKien.trim(),
          soLuongDat: parseInt(i.soLuongDat) || 1,
          donGiaDuKien: parseFloat(i.donGiaDuKien) || 0,
        })),
      });
      toast.success('Đã tạo đơn đặt hàng! Chờ quản lý duyệt.');
      onCreated();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  if (loadingSuppliers) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp <span className="text-red-500">*</span></label>
          <select className="input" value={nhaCungCapId} onChange={(e) => setNhaCungCapId(e.target.value)}>
            <option value="">— Chọn nhà cung cấp —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.ten} ({s.ma_nha_cung_cap})</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Danh sách tài liệu đặt</h3>
          <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline">+ Thêm dòng</button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-5">
                {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Nhan đề dự kiến *</label>}
                <input className="input text-sm" value={item.nhanDeDuKien} onChange={(e) => setItem(idx, 'nhanDeDuKien', e.target.value)} placeholder="Tên tài liệu" />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Số lượng</label>}
                <input className="input text-sm text-center" type="number" min={1} value={item.soLuongDat} onChange={(e) => setItem(idx, 'soLuongDat', e.target.value)} />
              </div>
              <div className="col-span-4">
                {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Đơn giá dự kiến (VNĐ)</label>}
                <input className="input text-sm tabular-nums" type="number" min={0} value={item.donGiaDuKien} onChange={(e) => setItem(idx, 'donGiaDuKien', e.target.value)} />
              </div>
              <div className="col-span-1 flex items-end pb-px">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-5">×</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500">Tổng giá trị dự kiến:</span>
          <span className="font-bold text-gray-900">{formatVND(tongDuKien)}</span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
        {loading ? <Spinner size="sm" /> : 'Tạo đơn đặt hàng'}
      </button>
    </form>
  );
}

// ── Nhà cung cấp ──────────────────────────────────────────────────────────────
function SupplierList() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSuppliers().then((r) => setSuppliers(r.data || [])).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;
  if (suppliers.length === 0) return <EmptyState icon="🏢" title="Chưa có nhà cung cấp" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Mã NCC', 'Tên nhà cung cấp', 'Điện thoại', 'Email', 'Trạng thái'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.ma_nha_cung_cap}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{s.ten}</td>
              <td className="px-4 py-3 text-gray-600">{s.so_dien_thoai || '—'}</td>
              <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={s.trang_thai} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OrdersPage() {
  const [tab, setTab] = useState('orders');

  return (
    <StaffLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Đơn đặt hàng <span className="text-sm font-normal text-gray-400">(A5)</span></h1>

        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrderList />}
        {tab === 'new' && <CreateOrderForm onCreated={() => setTab('orders')} />}
        {tab === 'suppliers' && <SupplierList />}
      </div>
    </StaffLayout>
  );
}
