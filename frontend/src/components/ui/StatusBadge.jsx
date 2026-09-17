// Bảng ánh xạ trạng thái → màu + nhãn tiếng Việt
const CONFIG = {
  // Bản sao
  san_sang:           { color: 'bg-green-100 text-green-800',  label: 'Sẵn sàng' },
  dang_muon:          { color: 'bg-blue-100 text-blue-800',    label: 'Đang mượn' },
  dat_truoc:          { color: 'bg-yellow-100 text-yellow-800',label: 'Đặt trước' },
  cho_bien_muc:       { color: 'bg-gray-100 text-gray-700',    label: 'Chờ biên mục' },
  hu_hong_cho_xu_ly:  { color: 'bg-orange-100 text-orange-800',label: 'Hư hỏng' },
  mat:                { color: 'bg-red-100 text-red-800',      label: 'Mất' },
  da_thanh_ly:        { color: 'bg-gray-200 text-gray-500',    label: 'Đã thanh lý' },
  // Phiếu mượn
  da_tra_dung_han:    { color: 'bg-green-100 text-green-800',  label: 'Đã trả đúng hạn' },
  da_tra_tre_han:     { color: 'bg-orange-100 text-orange-800',label: 'Đã trả (trễ hạn)' },
  bao_mat:            { color: 'bg-red-100 text-red-800',      label: 'Báo mất' },
  bao_hong:           { color: 'bg-orange-100 text-orange-800',label: 'Báo hỏng' },
  da_xu_ly_mat_hong:  { color: 'bg-gray-100 text-gray-600',   label: 'Đã xử lý' },
  // Đặt trước
  dang_cho:           { color: 'bg-blue-100 text-blue-800',    label: 'Đang chờ' },
  da_thong_bao:       { color: 'bg-green-100 text-green-800',  label: 'Sẵn sàng nhận' },
  da_muon:            { color: 'bg-gray-100 text-gray-600',    label: 'Đã mượn' },
  da_huy_ban_doc:     { color: 'bg-gray-100 text-gray-500',    label: 'Đã hủy' },
  // Thẻ bạn đọc
  hoat_dong:          { color: 'bg-green-100 text-green-800',  label: 'Hoạt động' },
  bi_khoa:            { color: 'bg-red-100 text-red-800',      label: 'Bị khóa' },
  het_han:            { color: 'bg-yellow-100 text-yellow-800',label: 'Hết hạn' },
  da_huy:             { color: 'bg-gray-200 text-gray-500',    label: 'Đã hủy' },
  // Phiếu phạt
  chua_thanh_toan:    { color: 'bg-red-100 text-red-800',      label: 'Chưa thanh toán' },
  da_thanh_toan:      { color: 'bg-green-100 text-green-800',  label: 'Đã thanh toán' },
  da_mien_giam:       { color: 'bg-blue-100 text-blue-800',    label: 'Đã miễn giảm' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { color: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
  );
}
