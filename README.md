# Hệ Thống Quản Lý Thư Viện

Hệ thống quản lý thư viện full-stack xây dựng trên React + Node.js + PostgreSQL, triển khai đầy đủ 26 luồng nghiệp vụ (A1–A5, B1–B4, C1–C8, D1–D3, E1–E2, F1–F4).

## Yêu Cầu Hệ Thống

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 7.x
- Docker & Docker Compose (tùy chọn, khuyến nghị)

## Cài Đặt Nhanh (Docker)

```bash
# Sao chép file biến môi trường
cp backend/.env.example backend/.env

# Chỉnh sửa backend/.env theo môi trường của bạn
# (DB password, JWT secret, v.v.)

# Khởi động toàn bộ hệ thống
docker-compose up -d

# Chạy migrations
docker-compose exec backend npx sequelize-cli db:migrate

# Chạy seed dữ liệu mẫu
docker-compose exec backend npx sequelize-cli db:seed:all
```

Frontend: http://localhost:3000  
Backend API: http://localhost:5000  
API Docs: http://localhost:5000/api-docs

## Cài Đặt Thủ Công

### 1. Backend

```bash
cd backend
npm install

# Tạo file .env từ .env.example và điền giá trị
cp .env.example .env

# Chạy migration tạo bảng
npx sequelize-cli db:migrate

# Chạy seed dữ liệu mẫu
npx sequelize-cli db:seed:all

# Khởi động server (development)
npm run dev

# Khởi động server (production)
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

## Biến Môi Trường (backend/.env)

| Biến | Mô tả | Mặc định |
|------|--------|---------|
| `NODE_ENV` | Môi trường (development/production) | development |
| `PORT` | Cổng backend | 5000 |
| `DB_HOST` | Host PostgreSQL | localhost |
| `DB_PORT` | Cổng PostgreSQL | 5432 |
| `DB_NAME` | Tên database | library_db |
| `DB_USER` | User PostgreSQL | postgres |
| `DB_PASSWORD` | Mật khẩu PostgreSQL | — |
| `REDIS_URL` | URL Redis | redis://localhost:6379 |
| `JWT_SECRET` | Khóa bí mật JWT (min 32 ký tự) | — |
| `JWT_EXPIRES_IN` | Thời hạn JWT | 8h |
| `FRONTEND_URL` | URL frontend (CORS) | http://localhost:3000 |

## Tài Khoản Mẫu (sau khi seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|---------|
| Admin | admin@library.edu.vn | Admin@123 |
| Quản lý | manager@library.edu.vn | Manager@123 |
| Thủ thư | librarian@library.edu.vn | Librarian@123 |
| Bạn đọc | reader@example.com | Reader@123 |

## Cấu Trúc Dự Án

```
library-management/
├── backend/
│   ├── src/
│   │   ├── config/         # Cấu hình DB, Redis
│   │   ├── controllers/    # Xử lý request (mỗi nhóm luồng)
│   │   ├── middleware/     # JWT auth, RBAC, validate
│   │   ├── models/         # Sequelize models (9 thực thể chính)
│   │   ├── routes/         # Định tuyến API RESTful
│   │   ├── services/       # Business logic (tách khỏi controller)
│   │   ├── jobs/           # Cron jobs (C8, C2-Exc1)
│   │   └── utils/          # Helper, error codes
│   ├── migrations/         # Sequelize migrations
│   └── seeders/            # Dữ liệu mẫu
├── frontend/
│   └── src/
│       ├── components/     # Shared components
│       ├── pages/
│       │   ├── member/     # Khu vực Bạn đọc
│       │   ├── librarian/  # Khu vực Thủ thư
│       │   └── admin/      # Khu vực Quản trị
│       ├── store/          # Redux Toolkit
│       ├── hooks/
│       └── services/       # API calls
└── docker-compose.yml
```

## Ánh Xạ Luồng Nghiệp Vụ → Endpoint API

| Luồng | Endpoint chính |
|-------|---------------|
| A1 Bổ sung tài liệu | POST /api/purchase-orders |
| A2 Biên mục | PUT /api/books/:id/catalog |
| A3 Cập nhật tài liệu | PUT /api/books/:id |
| A4 Thanh lý | POST /api/books/copies/:id/discard |
| A5 Kiểm kê | POST /api/inventory |
| B1 Đăng ký thẻ | POST /api/members |
| B2 Gia hạn thẻ | PUT /api/members/:id/renew-card |
| B3 Cập nhật/khóa thẻ | PUT /api/members/:id |
| B4 Hủy thẻ | DELETE /api/members/:id |
| C1 Tra cứu | GET /api/books/search |
| C2 Đặt trước | POST /api/reservations |
| C3 Mượn | POST /api/loans |
| C4 Trả đúng hạn | PUT /api/loans/:id/return |
| C5 Gia hạn mượn | PUT /api/loans/:id/renew |
| C6 Trả trễ | (tự động qua C4) |
| C7 Mất/hỏng | PUT /api/loans/:id/report-lost |
| C8 Nhắc hạn | Cron job tự động |
| D1 Tính phạt | POST /api/fines |
| D2 Thu bồi thường | PUT /api/fines/:id/pay |
| D3 Công nợ | GET /api/members/:id/debt |
| E1 Quản lý tài khoản | POST /api/staff |
| E2 Cấu hình | PUT /api/config |
| F1–F4 Báo cáo | GET /api/reports/* |
