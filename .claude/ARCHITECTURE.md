# TaskFlow — Tổng quan Kiến trúc Hệ thống

> Ứng dụng quản lý công việc theo phong cách Trello, kiến trúc Full-Stack với Node.js backend và React frontend.

---

## 1. Bức tranh tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│   React 18  ·  Redux Toolkit  ·  React Router v7  ·  Tailwind  │
│                       Port: 5173 (dev)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP/REST  (Axios + JWT Bearer)
                          │  Base URL: http://localhost:5000/api
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express API)                      │
│                                                                 │
│   Node.js 18+  ·  Express 4.18  ·  Joi Validation             │
│   Swagger UI (dev)  ·  Port: 5000                              │
│                                                                 │
│   ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│   │   Auth   │   │Organizations │   │       Boards         │  │
│   │  Module  │   │   Module     │   │       Module         │  │
│   └──────────┘   └──────────────┘   └──────────────────────┘  │
│                                                                 │
│   Middlewares: authenticate.js · validate.js                   │
│   Utils: jwt.js · bcrypt.js · email.js · response.js          │
└─────────────────────────┬───────────────────────────────────────┘
                          │  pg (PostgreSQL driver)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL 16                              │
│                  (Docker container, port 5432)                  │
│                      Database: mydb                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cấu trúc thư mục dự án

```
Duy_AI_Plan/
├── Backend/                    # REST API (Node.js + Express)
│   ├── src/
│   │   ├── app.js              # Entry point, route mounting
│   │   ├── configs/
│   │   │   ├── env.js          # Biến môi trường
│   │   │   ├── postgres.js     # Connection pool PostgreSQL
│   │   │   └── swagger.js      # Cấu hình Swagger (dev only)
│   │   ├── middlewares/
│   │   │   ├── authenticate.js # Xác thực JWT
│   │   │   └── validate.js     # Validation Joi
│   │   ├── modules/
│   │   │   ├── auth/           # Đăng ký, đăng nhập, JWT
│   │   │   ├── organizations/  # Workspace CRUD + members
│   │   │   └── boards/         # Board CRUD + members
│   │   └── utils/
│   │       ├── jwt.js          # Generate/verify tokens
│   │       ├── bcrypt.js       # Hash mật khẩu
│   │       ├── email.js        # Gửi email (Nodemailer)
│   │       └── response.js     # Chuẩn hoá JSON response
│   ├── migrations/
│   │   └── 001_init.sql        # Schema toàn bộ 15 bảng
│   ├── scripts/release.sh      # Script release (Docker tag)
│   ├── Dockerfile
│   ├── docker-compose.yml      # PostgreSQL service
│   └── docker-compose.prod.yml
│
├── Frontend/                   # React SPA
│   ├── src/
│   │   ├── main.jsx            # Entry point React
│   │   ├── App.jsx             # Root router (protected/public routes)
│   │   ├── api/
│   │   │   └── axiosInstance.js # Axios + JWT interceptor
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, AuthLayout, Navbar, Sidebar
│   │   │   ├── board/          # CardItem, ListColumn, CardDetailModal
│   │   │   └── ui/             # Button, Modal, Avatar, Badge, Input…
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, VerifyEmail, ForgotPassword, Reset
│   │   │   ├── workspaces/     # WorkspacesPage, BoardListPage, Settings
│   │   │   ├── boards/         # BoardPage (Kanban canvas)
│   │   │   └── profile/        # ProfilePage
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/         # authSlice, boardSlice, notificationSlice
│   │   ├── services/           # API calls (auth, workspace, board, card, list)
│   │   ├── hooks/              # useAuth, useBoard, usePermission, useDebounce…
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── data/
│   │       ├── constants.js
│   │       └── mockData.js
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── .claude/
    ├── ARCHITECTURE.md         # (file này)
    ├── settings.json
    └── plan/                   # Tài liệu thiết kế
        ├── product_description.md
        ├── DATABASE_DESIGN.md
        ├── FRONTEND_DESCRIPTION.md
        └── learning_history.md
```

---

## 3. Kiến trúc Backend — Luồng xử lý Request

```
Request
   │
   ▼
Express Router
   │
   ├── [authenticate.js]   ← Kiểm tra JWT (Bearer token)
   │        │
   │        ▼ req.user (user payload)
   ├── [validate.js]       ← Validate body/query qua Joi schema
   │
   ▼
Controller                 ← Parse req/res, gọi service
   │
   ▼
Service                    ← Business logic, kiểm tra quyền
   │
   ▼
Model                      ← SQL query qua pg pool
   │
   ▼
PostgreSQL 16
```

### Pattern mỗi module: Route → Controller → Service → Model

| Tầng | Trách nhiệm |
|---|---|
| **Route** | Định nghĩa endpoint, áp dụng middleware, gọi controller |
| **Controller** | Nhận req/res, parse dữ liệu đầu vào, trả response |
| **Service** | Business logic, kiểm tra phân quyền, tổng hợp dữ liệu |
| **Model** | Thực thi câu SQL, trả raw data từ PostgreSQL |

---

## 4. Các Module Backend

### 4.1 Auth Module (`/api/v1/auth`)

```
POST /register          → Tạo user, gửi OTP email (15 phút)
POST /verify-email      → Xác thực OTP, kích hoạt tài khoản
POST /login             → Trả access token (15m) + refresh token (7d)
POST /refresh           → Cấp access token mới từ refresh token
POST /logout            → Thu hồi refresh token
GET  /me                → Thông tin user hiện tại  [auth required]
POST /forgot-password   → Gửi link reset về email
POST /reset-password    → Đổi mật khẩu, revoke toàn bộ tokens
```

### 4.2 Organizations Module (`/api/v1/organizations`)

```
POST   /                   → Tạo workspace mới
GET    /                   → Danh sách workspaces của user
GET    /:orgId             → Chi tiết workspace
PUT    /:orgId             → Cập nhật  [owner / admin]
DELETE /:orgId             → Xoá       [owner only]
GET    /:orgId/members     → Danh sách thành viên
POST   /:orgId/members     → Mời thành viên
PUT    /:orgId/members/:userId  → Đổi role thành viên
DELETE /:orgId/members/:userId  → Xoá thành viên
```

### 4.3 Boards Module

```
# Mounted tại /api/v1/organizations/:orgId/boards
POST  /                   → Tạo board mới
GET   /                   → Danh sách boards trong workspace

# Mounted tại /api/v1/boards/:boardId
GET    /                  → Chi tiết board
PUT    /                  → Cập nhật board
DELETE /                  → Xoá board
GET    /members           → Danh sách board members
POST   /members           → Mời member vào board
PUT    /members/:userId   → Đổi role
DELETE /members/:userId   → Xoá member
```

---

## 5. Lược đồ Database (PostgreSQL 16)

### Phase 1 — Đã triển khai (7 bảng)

```
users
  ├── id (UUID PK)
  ├── email (UNIQUE)
  ├── password_hash
  ├── full_name
  ├── avatar_url
  ├── is_verified
  └── is_active

refresh_tokens                       email_verifications
  ├── user_id → users                  ├── user_id → users
  ├── token (UNIQUE)                   ├── token (UNIQUE)
  ├── expires_at                       ├── type (verify_email | reset_password)
  ├── is_revoked                       ├── expires_at
  └── device_info                      └── used_at

organizations                        organization_members
  ├── id (UUID PK)                      ├── organization_id → organizations
  ├── name                              ├── user_id → users
  ├── slug (UNIQUE)                     └── role (owner | admin | member)
  └── created_by → users

boards                               board_members
  ├── id (UUID PK)                      ├── board_id → boards
  ├── organization_id → organizations   ├── user_id → users
  ├── visibility (private|workspace|public)  └── role (owner|admin|member|viewer)
  └── created_by → users
```

### Phase 2–4 — Đã thiết kế, chưa implement (8 bảng)

```
lists         → thuộc board, có position
cards         → thuộc list, có position, due_date, priority
card_members  → gán user vào card
labels        → nhãn của board
card_labels   → gán nhãn vào card
checklists    → checklist trong card
checklist_items
comments      → bình luận trên card (có threading)
attachments   → file đính kèm
activity_logs → lịch sử hành động
notifications → thông báo người dùng
```

---

## 6. Kiến trúc Frontend

```
Browser
  │
  App.jsx (React Router v7)
  │
  ├── PublicRoute ──────────────────────────────────────────────┐
  │   ├── /login          → LoginPage                          │
  │   ├── /register       → RegisterPage                       │
  │   ├── /verify-email   → VerifyEmailPage                    │
  │   ├── /forgot-password→ ForgotPasswordPage                 │
  │   └── /reset-password → ResetPasswordPage                  │
  │                                                             │
  └── ProtectedRoute (kiểm tra auth)                           │
      └── AppLayout (Navbar + Sidebar)                         │
          ├── /home             → WorkspacesPage               │
          ├── /workspaces/:slug → BoardListPage                │
          ├── /board/:boardId   → BoardPage (Kanban)           │
          └── /profile          → ProfilePage                  │
                                                               │
                  AuthLayout ◄──────────────────────────────────┘
                  (dùng cho auth pages)
```

### State Management

```
Redux Store
├── authSlice
│   ├── user (profile object)
│   ├── token (JWT access token)
│   └── isAuthenticated
├── boardSlice
│   ├── currentBoard
│   ├── lists []
│   └── cards {}
└── notificationSlice
    └── notifications []
```

### API Layer

```
axiosInstance (Axios)
  ├── baseURL: VITE_API_URL || http://localhost:5000/api
  ├── Request interceptor → thêm Authorization: Bearer <token>
  └── Response interceptor → 401 → redirect /login

services/
  ├── auth.service.js       → /auth/*
  ├── workspace.service.js  → /organizations/*
  ├── board.service.js      → /boards/*
  ├── list.service.js       → /boards/:id/lists/* (Phase 2)
  ├── card.service.js       → /lists/:id/cards/*  (Phase 2)
  └── notification.service.js                      (Phase 4)
```

---

## 7. Luồng Xác thực (Authentication Flow)

```
1. ĐĂNG KÝ
   User → POST /auth/register
       ← 201 {user}  +  email OTP (6 chữ số, 15 phút)

2. XÁC THỰC EMAIL
   User → POST /auth/verify-email {email, token}
       ← 200 {user, verified: true}

3. ĐĂNG NHẬP
   User → POST /auth/login {email, password}
       ← 200 {accessToken (15m), refreshToken (7d), user}
              │
              ├── accessToken  → lưu memory (Redux)
              └── refreshToken → lưu localStorage

4. GỌI API BẢO VỆ
   Axios interceptor → header: Authorization: Bearer <accessToken>

5. LÀM MỚI TOKEN
   (Khi accessToken hết hạn)
   POST /auth/refresh {refreshToken}
       ← 200 {accessToken mới}

6. ĐĂNG XUẤT
   POST /auth/logout {refreshToken}
       ← 200  +  token bị revoke trong DB

7. ĐẶT LẠI MẬT KHẨU
   POST /auth/forgot-password {email}
       ← email chứa reset link (1 giờ)
   POST /auth/reset-password {token, newPassword}
       ← 200  +  revoke toàn bộ refresh tokens của user
```

---

## 8. Phân quyền (RBAC)

### Organization Roles

| Quyền | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem boards | ✅ | ✅ | ✅ |

### Board Roles

| Quyền | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ | ❌ |
| Tạo / xoá list, card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

---

## 9. Hạ tầng & Triển khai

```
Development:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Frontend    │     │   Backend    │     │  PostgreSQL  │
  │  Vite dev    │────▶│  nodemon     │────▶│  Docker      │
  │  :5173       │     │  :5000       │     │  :5432       │
  └──────────────┘     └──────────────┘     └──────────────┘

Production:
  ┌──────────────────────────────────────────────────────┐
  │               docker-compose.prod.yml                │
  │                                                      │
  │  ┌─────────────────┐        ┌────────────────────┐  │
  │  │  Backend Image  │        │   PostgreSQL 16     │  │
  │  │  (Dockerfile)   │◄──────▶│   (volume persist) │  │
  │  └─────────────────┘        └────────────────────┘  │
  └──────────────────────────────────────────────────────┘
  
  Release: scripts/release.sh
    → docker build
    → docker tag :latest + :vX.Y.Z
    → docker push
```

---

## 10. Công nghệ sử dụng

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| Frontend Framework | React | 18.3.1 |
| State Management | Redux Toolkit | 2.3.0 |
| Client Routing | React Router | 7.1.1 |
| Drag & Drop | @dnd-kit | 6.x / 8.x |
| HTTP Client | Axios | 1.7.9 |
| UI Styling | Tailwind CSS | 3.4.17 |
| Build Tool | Vite | 6.0.5 |
| Icons | Lucide React | 0.469.0 |
| Backend Framework | Express.js | 4.18.2 |
| Database Driver | pg (node-postgres) | 8.11.3 |
| Authentication | jsonwebtoken | 9.0.2 |
| Password Hashing | bcryptjs | 2.4.3 |
| Validation | Joi | 17.11.0 |
| Email | Nodemailer | 8.0.5 |
| API Docs | Swagger UI Express | 5.0.1 |
| Database | PostgreSQL | 16 |
| Containerization | Docker + Compose | — |

---

## 11. Trạng thái phát triển

| Phase | Tính năng | Trạng thái |
|---|---|---|
| **Phase 1** | Auth (register, login, JWT, OTP, reset password) | ✅ Hoàn thành |
| **Phase 1** | Organization CRUD + member management | ✅ Hoàn thành |
| **Phase 1** | Board CRUD + board member management | ✅ Hoàn thành |
| **Phase 1** | Frontend: Auth pages, Workspace/Board pages, Redux, Layout | ✅ Hoàn thành |
| **Phase 2** | Lists & Cards CRUD + drag-drop (Kanban) | ⏳ Chưa implement |
| **Phase 2** | Card members, Labels, Checklists | ⏳ Chưa implement |
| **Phase 3** | Comments, Attachments, File upload | ⏳ Chưa implement |
| **Phase 3** | Activity logs | ⏳ Chưa implement |
| **Phase 4** | Notifications system (real-time) | ⏳ Chưa implement |