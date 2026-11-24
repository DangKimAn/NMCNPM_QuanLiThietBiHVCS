# Hệ thống Quản lý Thiết bị Học viện Cơ sở (HVCS)

Hệ thống quản lý thiết bị, phản ánh báo hỏng và thông báo dành cho Học viện Cơ sở.

## Công nghệ

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** NestJS + Prisma ORM + PostgreSQL (Supabase)
- **Realtime:** Socket.IO (WebSocket)

## Cấu trúc

```
├── frontend/           # React SPA
│   ├── src/
│   │   ├── pages/      # Trang theo role (admin, manager, student, auth)
│   │   ├── components/ # UI components, layouts
│   │   ├── services/   # API calls (axios + socket)
│   │   ├── hooks/      # Custom hooks (useFormConfig, useCrud)
│   │   └── config/     # env
│   └── ...
├── backend/            # NestJS REST API
│   ├── src/
│   │   ├── auth/       # JWT authentication (access + refresh token)
│   │   ├── auth/       # JWT authentication (access + refresh token)
│   │   ├── user/       # Người dùng + roles + permissions
│   │   ├── role/       # Quản lý vai trò
│   │   ├── permission/ # Quản lý quyền hạn
│   │   ├── equipment/  # Thiết bị + allocation + transfer
│   │   ├── room/       # Proxy Room API (external service)
│   │   ├── report/     # Phản ánh báo hỏng
│   │   ├── notification/ # Thông báo (realtime qua Socket.IO)
│   │   ├── form-config/ # Cấu hình form động (Admin)
│   │   ├── events/     # WebSocket gateway
│   │   ├── audit-log/  # Ghi lại hoạt động
│   │   ├── health/     # Health check
│   │   └── prisma/     # Database schema + service
│   └── prisma/
│       └── schema.prisma
```

## Role trong hệ thống

| Role | Mô tả |
|------|-------|
| **ADMIN** | Quản lý người dùng, phân quyền, cấu hình form động, xem audit log |
| **MANAGER** | Quản lý thiết bị, phòng học, xử lý báo hỏng, tạo thông báo |
| **TEACHER** | Xem thiết bị theo phòng, gửi báo hỏng, xem thông báo |
| **STUDENT** | Xem thiết bị theo phòng, gửi báo hỏng, xem thông báo |

## Tài khoản mặc định

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin_super` | `passwordadmindefault` | ADMIN |
| `manager_01` | `passwordmanagerdefault` | MANAGER |
| `teacher_01` | `passwordteacherdefault` | TEACHER |
| `student_01` | `passwordstudentdefault` | STUDENT |

## Cài đặt & Chạy

### Yêu cầu

- Node.js 18+
- PostgreSQL (hoặc Supabase)

### Backend

```bash
cd backend
npm install

# Cấu hình môi trường
cp .env.example .env
# Sửa .env: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DATABASE_URL

# Áp dụng migration & generate Prisma Client
npx prisma migrate deploy
npx prisma generate

# Seed dữ liệu mẫu
npx prisma db seed

# Chạy dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

## API

Backend chạy tại `http://localhost:3000`.  
Swagger docs: `http://localhost:3000/api`

> **Room API:** Phòng học được quản lý bởi external service (`ROOM_API`).  
> **Lưu ý:** `POST /api/auth/register` hiện đã bị DISABLE (chỉ Admin tạo user qua dashboard).

### API chính

| Endpoint | Mô tả | Auth |
|----------|-------|------|
| `POST /api/auth/login` | Đăng nhập | Public |
| `POST /api/auth/refresh` | Refresh token | Public |
| `GET /api/user` | Danh sách user (ADMIN) | JWT |
| `GET /api/equipments` | Danh sách thiết bị (`?page=&limit=`) | Public |
| `GET /api/equipments/:id` | Chi tiết thiết bị | Public |
| `GET /api/reports` | Danh sách báo hỏng (`?page=&limit=`) | JWT |
| `GET /api/notifications` | Thông báo của user hiện tại | JWT |
| `POST /api/notifications` | Tạo thông báo (MANAGER, ADMIN) | JWT |

### Phân trang

Các endpoint `equipments`, `reports`, `user` hỗ trợ:
```
GET /api/equipments?page=1&limit=20
```

Không truyền `page` thì trả về mảng đầy đủ (backward compatible).

## Tối ưu hiệu suất

- **Code splitting**: React.lazy + Suspense, mỗi route là chunk riêng
- **Chunk tách riêng**: React vendor, icons, socket.io, xlsx, axios
- **DB Indexes**: 18+ index trên foreign key và filter field
- **Phân trang**: giới hạn mặc định 500 records/list API
- **Realtime**: Socket.IO với authentication, emit theo role/user
- **Audit log**: Ghi lại mọi thao tác POST/PUT/PATCH/DELETE
