# Hướng dẫn Cài đặt & Test Nội bộ (Local)

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Node.js | 18.x trở lên | `node -v` để kiểm tra |
| npm | 9.x trở lên | đi kèm Node.js |
| PostgreSQL | 14.x trở lên | phải đang chạy |
| Redis | 6.x trở lên | phải đang chạy |

---

## Bước 1 — Cấu hình môi trường Backend

```bash
cd library-management/backend
copy .env.example .env
```

Mở file `.env` và chỉnh các giá trị sau:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=<mật khẩu postgres của bạn>

REDIS_URL=redis://localhost:6379

JWT_SECRET=super-secret-key-thay-bang-chuoi-ngau-nhien-dai-hon-32-ky-tu
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://localhost:3000
```

---

## Bước 2 — Tạo database

Mở psql hoặc pgAdmin và chạy:

```sql
CREATE DATABASE library_db;
```

Nếu muốn tạo luôn database test để chạy unit test:

```sql
CREATE DATABASE library_db_test;
```

---

## Bước 3 — Cài đặt dependencies

**Backend:**
```bash
cd library-management/backend
npm install
```

**Frontend:**
```bash
cd library-management/frontend
npm install
```

---

## Bước 4 — Chạy migrations & seed dữ liệu mẫu

```bash
cd library-management/backend
npm run migrate
npm run seed
```

> **Lưu ý:** `npm run seed` sẽ tạo sẵn tài khoản nhân viên, bạn đọc, tài liệu, và một số phiếu mượn mẫu.

---

## Bước 5 — Khởi động hệ thống

Mở **2 terminal** riêng biệt:

**Terminal 1 — Backend:**
```bash
cd library-management/backend
npm run dev
```
Backend chạy tại: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd library-management/frontend
npm run dev
```
Frontend chạy tại: `http://localhost:3000`

---

## Tài khoản test sau khi seed

### Nhân viên (đăng nhập tại `/login`)

| Email | Mật khẩu | Vai trò | Quyền |
|---|---|---|---|
| admin@library.edu.vn | Admin@123 | Admin | Toàn quyền |
| manager@library.edu.vn | Manager@123 | Quản lý | Phê duyệt, mở khóa thẻ, hủy thẻ |
| librarian@library.edu.vn | Librarian@123 | Thủ thư | Mượn/trả/đặt trước, thu phí |
| librarian2@library.edu.vn | Librarian@123 | Thủ thư | Như trên |

### Bạn đọc (đăng nhập tại `/member/login` — dùng **Mã thẻ**, không dùng email)

| Mã thẻ | Mật khẩu | Tình trạng | Dùng để test |
|---|---|---|---|
| BD2024001 | Reader@123 | Hoạt động | Luồng bình thường (C3, C4, C5) |
| BD2024002 | Reader@123 | Hoạt động | Luồng bình thường |
| BD2024003 | Reader@123 | Bị khóa | Test C3-Exc1 (không cho mượn khi khóa) |
| GV2024001 | Reader@123 | Hoạt động | Giảng viên — định mức mượn cao |
| BD2023099 | Reader@123 | Hoạt động | Thẻ sắp hết hạn — test B2 (gia hạn thẻ) |
| BD2023050 | Reader@123 | Hoạt động | Có công nợ — test D1/D3 |

---

## Kiểm thử các luồng chính

### A — Quản lý tài liệu
- **A1** Tạo tài liệu: Staff → Tài liệu → Thêm mới
- **A2** Biên mục: Vào chi tiết tài liệu → nhập vị trí kho → Biên mục
- **A3** Sửa thông tin: Chi tiết tài liệu → Chỉnh sửa
- **A4** Hủy bản sao: Chi tiết tài liệu → chọn bản sao → Hủy bản sao
- **A5** Đặt hàng bổ sung: Staff → Đặt hàng (chỉ `quan_ly`/`admin`)

### B — Quản lý thẻ bạn đọc
- **B1** Đăng ký thẻ: Staff → Bạn đọc → Đăng ký mới
- **B2** Gia hạn thẻ: Staff → Bạn đọc → chọn BD2023099 → Gia hạn
- **B3** Khóa/Mở khóa: Staff → Bạn đọc → chọn thành viên → Khóa thẻ
  - Lưu ý: chỉ `quan_ly`/`admin` mới mở khóa được
- **B4** Hủy thẻ: chỉ `quan_ly`/`admin`

### C — Lưu thông
- **C1** Tra cứu: đăng nhập bạn đọc → `/member/search`
- **C2** Đặt trước: member → chi tiết sách → Đặt trước
- **C3** Cho mượn: Staff → Mượn/Trả → nhập mã bản sao
- **C4** Trả sách: Staff → Mượn/Trả → nhập mã bản sao → Trả
- **C5** Gia hạn: Staff → Danh sách mượn → Gia hạn
- **C7** Báo mất/hư: Staff → Danh sách mượn → Báo mất/hư
- **C8** Nhắc hạn: cron job tự động lúc 7:00 sáng (hoặc chỉnh `CRON_REMINDER_SCHEDULE`)

### D — Phiếu phạt & Kiểm kê
- **D1** Thu phí: Staff → Phiếu phạt → Thanh toán / Miễn giảm
- **D2** Kiểm kê: Staff → Kiểm kê → Tạo phiên → Quét barcode
- **D3** Xem công nợ: Staff → Bạn đọc → chọn BD2023050 → tab Công nợ

### E — Tài khoản
- **E1** Đăng nhập: `/login` (nhân viên) và `/member/login` (bạn đọc)
- **E2** Đổi mật khẩu: biểu tượng "🔑 Đổi MK" trên thanh header

### F — Báo cáo
- **F1** Thống kê lưu thông: Staff → Báo cáo → tab Lưu thông
- **F2** Thống kê tài liệu: Staff → Báo cáo → tab Tài liệu
- **F3** Thống kê bạn đọc: Staff → Báo cáo → tab Bạn đọc

---

## Chạy Unit Tests

> Cần có database `library_db_test` đã tạo (Bước 2).

```bash
cd library-management/backend
npm test
```

Các file test:
- `src/__tests__/auth.test.js` — E1 đăng nhập, E2 đổi mật khẩu
- `src/__tests__/circulation.test.js` — C1 tra cứu, C3 cho mượn, C4 trả sách
- `src/__tests__/members.test.js` — B1 đăng ký, B3 khóa/mở khóa thẻ

**Lưu ý:** Tests tự động dùng `DB_NAME_test` (= `library_db_test`) và mock Redis/Socket.io — không cần Redis thật để chạy test.

---

## Kiểm tra thông báo Real-time (Socket.io)

1. Đăng nhập với tài khoản member `BD2024001`
2. Member cần có sách đặt trước ở trạng thái `da_thong_bao`
3. Staff xử lý → biểu tượng chuông 🔔 trên header member sẽ có thông báo mới

Để test nhanh không cần đợi cron, có thể gọi thẳng:
```bash
curl -X POST http://localhost:5000/api/v1/circulation/reservations/<id>/notify \
  -H "Authorization: Bearer <staff_token>"
```

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `ECONNREFUSED 5432` | PostgreSQL chưa chạy | Khởi động PostgreSQL |
| `ECONNREFUSED 6379` | Redis chưa chạy | Khởi động Redis |
| `JWT_SECRET is required` | Thiếu file `.env` | Copy `.env.example` → `.env` |
| `relation "nhan_vien" does not exist` | Chưa migrate | Chạy `npm run migrate` |
| `SequelizeUniqueConstraintError` khi seed | Đã seed rồi | Chạy `npm run seed:undo` rồi seed lại |
| Port 3000/5000 bị chiếm | Tiến trình khác | Đổi port trong `.env` / `vite.config.js` |

---

## Cấu trúc URL

| Đường dẫn | Dành cho |
|---|---|
| `http://localhost:3000/login` | Đăng nhập (tab Nhân viên / Bạn đọc) |
| `http://localhost:3000/staff/dashboard` | Trang chủ nhân viên |
| `http://localhost:3000/member/search` | Trang tra cứu bạn đọc (OPAC) |
| `http://localhost:5000/api/v1/...` | REST API backend |
| `http://localhost:5000/api/v1/health` | Health check backend |
