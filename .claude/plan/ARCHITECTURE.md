# TaskFlow — Tổng quan Kiến trúc Hệ thống

> Ứng dụng quản lý công việc theo phong cách Trello, kiến trúc Full-Stack với Node.js backend và React frontend.

---

## 1. Bức tranh tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│   React 18  ·  Redux Toolkit  ·  React Router v7  ·  Tailwind  │
│   useNotificationStream (EventSource SSE)                      │
│                       Port: 5173 (dev)                         │
└──────────┬──────────────────────────────────┬───────────────────┘
           │  HTTP/REST  (Axios + JWT Bearer)  │  SSE (EventSource)
           │  Base URL: /api/v1               │  GET /notifications/stream?token=
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express API)                      │
│                                                                 │
│   Node.js 18+  ·  Express 4.18  ·  Joi Validation             │
│   Swagger UI (dev)  ·  Port: 3000                              │
│                                                                 │
│   ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌────────────┐  │
│   │   Auth   │  │Organizations │  │ Boards │  │Lists+Cards │  │
│   └──────────┘  └──────────────┘  └────────┘  └────────────┘  │
│   ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌────────────┐  │
│   │  Labels  │  │   Comments   │  │Attachm.│  │Invitations │  │
│   └──────────┘  └──────────────┘  └────────┘  └────────────┘  │
│   ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│   │   Activity Logs      │  │  Notifications (SSE stream)     │ │
│   └──────────────────────┘  └─────────────────────────────────┘ │
│                                                                 │
│   Utils: activityLogger (CTE INSERT + broadcastCardActivity)   │
│          notificationSender (sendNotification + broadcast)     │
│          sseClients (in-memory Map userId→res)                 │
│          tokenCrypto (AES-256-GCM) · storage (MinIO)          │
│   Jobs:  dueDateReminder (cron hourly)                         │
└──────┬──────────────────────────┬──────────────────────────────┘
       │  pg driver               │  ioredis / minio SDK
       ▼                          ▼
┌──────────────┐   ┌────────────────────┐   ┌──────────────────┐
│ PostgreSQL 16│   │   Redis            │   │   MinIO          │
│ Docker :5432 │   │   Docker :6379     │   │   Docker :9000   │
│ (mydb)       │   │ token blacklist    │   │ object storage   │
└──────────────┘   └────────────────────┘   └──────────────────┘
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
│   │   │   ├── auth/           # Đăng ký, đăng nhập, JWT (9 endpoints)
│   │   │   ├── organizations/  # Workspace CRUD + members (9 endpoints)
│   │   │   ├── boards/         # Board CRUD + members (10 endpoints)
│   │   │   ├── lists/          # List CRUD (4 endpoints)
│   │   │   ├── cards/          # Card CRUD + assignee (5 endpoints)
│   │   │   ├── labels/         # Label CRUD + card-label (7 endpoints)
│   │   │   ├── comments/       # Comment CRUD threaded (4 endpoints)
│   │   │   ├── activityLogs/   # Activity feed read (2 endpoints)
│   │   │   ├── attachments/    # File upload MinIO (4 endpoints)
│   │   │   ├── invitations/    # Board invite accept flow (2 endpoints)
│   │   │   └── notifications/  # SSE stream + CRUD (6 endpoints)
│   │   ├── jobs/
│   │   │   └── dueDateReminder.js  # Cron hourly, dedup 24h
│   │   └── utils/
│   │       ├── jwt.js              # Generate/verify tokens
│   │       ├── bcrypt.js           # Hash mật khẩu
│   │       ├── email.js            # Nodemailer + invite templates
│   │       ├── response.js         # Chuẩn hoá JSON response
│   │       ├── activityLogger.js   # CTE INSERT → enriched row → broadcastCardActivity
│   │       ├── notificationSender.js # sendNotification + broadcastCardActivity
│   │       ├── sseClients.js       # In-memory Map userId→res
│   │       ├── storage.js          # MinIO upload/delete/getPublicUrl
│   │       └── tokenCrypto.js      # AES-256-GCM encrypt/decrypt
│   ├── migrations/
│   │   ├── 001_init.sql            # Schema gốc (11 bảng)
│   │   ├── 002_board_invitations.sql
│   │   ├── 003_hash_refresh_tokens.sql
│   │   ├── 004_token_blacklist.sql
│   │   └── 005_attachments_cover.sql
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
│   │   │   └── axiosInstance.js # Axios + JWT interceptor + token refresh queue
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, AuthLayout, Navbar, Sidebar
│   │   │   ├── board/          # CardItem, ListColumn, CardDetailModal, InviteMemberModal
│   │   │   └── ui/             # Button, Modal, Avatar, Badge, Input…
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, VerifyEmail, ForgotPassword, Reset
│   │   │   ├── workspaces/     # WorkspacesPage, BoardListPage, Settings, CreateWorkspace
│   │   │   ├── boards/         # BoardPage (Kanban canvas), CreateBoardModal
│   │   │   ├── profile/        # ProfilePage
│   │   │   └── invitations/    # AcceptInvitePage
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/         # authSlice, workspaceSlice, notificationSlice
│   │   │                       # boardSlice (+ openCardId, injectCardActivity)
│   │   ├── services/           # auth, workspace, board, card, list,
│   │   │                       # label, activityLog, notification
│   │   ├── hooks/
│   │   │   └── useNotificationStream.js  # SSE topic routing
│   │   └── data/
│   │       └── constants.js    # PRIORITY_COLOR, NOTIFICATION_TYPE, etc.
│   ├── vite.config.js          # Port 5173
│   └── tailwind.config.js
│
└── .claude/
    ├── settings.json
    └── plan/                   # Tài liệu thiết kế
        ├── ARCHITECTURE.md         # (file này)
        ├── PRODUCT_DESCRIPTION.md
        ├── DATABASE_DESIGN.md
        ├── FRONTEND_DESCRIPTION.md
        ├── PROJECT_DESCRIPTION.md
        └── LEARNING_HISTORY.md
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
POST   /:orgId/members     → Mời thành viên (by email)
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
POST   /members           → Mời member vào board (by email)
PUT    /members/:userId   → Đổi role
DELETE /members/:userId   → Xoá member
```

### 4.4 Lists Module ✅ Mới

```
# Mounted tại /api/v1/boards/:boardId/lists
GET  /                    → Danh sách lists (ordered by position)
POST /                    → Tạo list mới (position = MAX + 1)

# Mounted tại /api/v1/lists/:listId
PUT    /                  → Cập nhật list (name, position, isArchived)
DELETE /                  → Xoá list
```

### 4.5 Cards Module ✅

```
# Mounted tại /api/v1/lists/:listId/cards
GET  /                    → Danh sách cards (kèm assignees + labels qua LATERAL JOIN)
POST /                    → Tạo card mới

# Mounted tại /api/v1/cards/:cardId
GET    /                  → Chi tiết card (kèm assignees + labels)
PUT    /                  → Cập nhật card (title, description, priority,
│                           dueDate, assigneeId, isArchived, position, listId)
DELETE /                  → Xoá card
```

**Ghi chú:** `PUT /cards/:cardId` nhận `assigneeId` (single) → xoá toàn bộ `card_members` cũ và insert mới nếu có. Triggers `logActivity` (card.created / card.updated / card.deleted).

### 4.6 Labels Module ✅

```
# Mounted tại /api/v1/boards/:boardId/labels
GET  /                    → Danh sách labels của board
POST /                    → Tạo label mới (name + color)

# Mounted tại /api/v1/labels/:labelId
PUT    /                  → Cập nhật tên/màu label
DELETE /                  → Xoá label (tự động gỡ khỏi tất cả cards)

# Mounted tại /api/v1/cards/:cardId/labels
GET  /                    → Labels đã gán cho card
POST  /:labelId           → Gán label vào card
DELETE /:labelId          → Gỡ label khỏi card
```

### 4.7 Comments Module ✅

```
# Mounted tại /api/v1/cards/:cardId/comments
GET  /                    → Danh sách comments (top-level + replies LATERAL)
POST /                    → Tạo comment mới (content, parentId optional)

# Mounted tại /api/v1/comments/:commentId
PUT    /                  → Sửa comment (chỉ tác giả, sets is_edited=true)
DELETE /                  → Xoá comment (chỉ tác giả; replies float up: parent_id→NULL)
```

**Nesting guard:** Server từ chối reply-to-reply (`parent_id` trỏ đến comment đã có `parent_id`).

### 4.8 Activity Logs Module ✅

```
# Mounted tại /api/v1/boards/:boardId/activity
GET /                     → Activity feed của board (phân trang limit/offset)

# Mounted tại /api/v1/cards/:cardId/activity
GET /                     → Activity feed của card (phân trang)
```

**Ghi log tự động:** `activityLogger.js` được gọi fire-and-forget trong `cards.service`, `lists.service`, `comments.service`. Không throw, không block main request.

---

## 5. Lược đồ Database (PostgreSQL 16)

### Đã triển khai đầy đủ (10 bảng)

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

lists                                cards
  ├── id (UUID PK)                      ├── id (UUID PK)
  ├── board_id → boards                 ├── list_id → lists
  ├── name                              ├── board_id → boards
  ├── position (FLOAT)                  ├── title
  └── is_archived                       ├── description
                                        ├── position (FLOAT)
card_members                            ├── priority (low|medium|high|critical)
  ├── card_id → cards                   ├── due_date
  ├── user_id → users                   ├── cover_color
  └── assigned_by → users               └── is_archived
```

### Đã có API đầy đủ (6 bảng)

```
labels            → nhãn màu của board                       ✅ 7 endpoints
card_labels       → gán nhãn vào card                        ✅ (thuộc labels module)
comments          → bình luận trên card (1-level thread)     ✅ 4 endpoints
                    createComment + updateComment dùng CTE JOIN để trả về user info
activity_logs     → lịch sử hành động (JSONB metadata)       ✅ 2 read endpoints
                    activityLogger dùng CTE INSERT → broadcastCardActivity via SSE
attachments       → file đính kèm (MinIO)                    ✅ 4 endpoints
notifications     → thông báo người dùng                     ✅ 6 endpoints + SSE stream
board_invitations → lời mời vào board qua email              ✅ 5 endpoints
```

### Đã thiết kế trong SQL, chưa có API (2 bảng)

```
checklists      → checklist trong card    ⏳
checklist_items → item của checklist      ⏳
```

---

## 6. Kiến trúc Frontend

```
Browser
  │
  App.jsx (React Router v7)
  │
  ├── PublicRoute ─────────────────────────────────────────────────┐
  │   ├── /login          → LoginPage                             │
  │   ├── /register       → RegisterPage                          │
  │   ├── /verify-email   → VerifyEmailPage                       │
  │   ├── /forgot-password→ ForgotPasswordPage                    │
  │   └── /reset-password → ResetPasswordPage                     │
  │                                                                │
  └── ProtectedRoute (kiểm tra Redux auth state)                  │
      ├── /home                    → WorkspacesPage               │
      ├── /workspaces/new          → CreateWorkspacePage          │
      ├── /workspaces/:slug        → BoardListPage                │
      ├── /workspaces/:slug/settings → WorkspaceSettingsPage      │
      ├── /board/:boardId          → BoardPage (Kanban)           │
      └── /profile                 → ProfilePage                  │
                                                                   │
              AuthLayout ◄──────────────────────────────────────────┘
              (dùng cho auth pages)
```

### State Management

```
Redux Store
├── authSlice
│   ├── user (profile object)
│   ├── token (JWT access token — also in localStorage)
│   ├── refreshToken (also in localStorage)
│   └── isAuthenticated
├── workspaceSlice
│   └── workspaces []        ← danh sách org của user
├── boardSlice
│   ├── currentBoard
│   ├── lists []             ← load từ API khi vào BoardPage
│   ├── cards {}             ← { [listId]: Card[] }
│   ├── boardLabels []       ← labels của board hiện tại
│   ├── cardComments []      ← comments của card đang mở (nested replies)
│   ├── cardActivity []      ← activity log của card đang mở
│   ├── loadingBoard
│   ├── loadingLists
│   ├── loadingComments
│   └── loadingActivity
└── notificationSlice
    └── notifications []
```

### API Layer

```
axiosInstance (Axios)
  ├── baseURL: VITE_API_URL || http://localhost:3000/api/v1
  ├── Request interceptor  → thêm Authorization: Bearer <token>
  └── Response interceptor → 401:
        ├── Gọi POST /auth/refresh (một lần duy nhất, có queue)
        ├── Retry toàn bộ request trong queue với token mới
        └── Nếu refresh thất bại → xóa localStorage → redirect /login

services/
  ├── auth.service.js          → /auth/*
  ├── workspace.service.js     → /organizations/*
  ├── board.service.js         → /organizations/:id/boards, /boards/:id/*
  ├── list.service.js          → /boards/:id/lists, /lists/:id
  ├── card.service.js          → /lists/:id/cards, /cards/:id, /cards/:id/comments
  ├── label.service.js         → /boards/:id/labels, /labels/:id, /cards/:id/labels  ✅
  ├── activityLog.service.js   → /boards/:id/activity, /cards/:id/activity           ✅
  └── notification.service.js  → (placeholder, Phase 4)
```

### BoardPage — Luồng tải dữ liệu

```
mount BoardPage(boardId)
  │
  ├── dispatch(fetchBoard(boardId))       → GET /boards/:boardId
  ├── dispatch(fetchBoardLists(boardId))  → GET /boards/:boardId/lists
  │     └── Promise.all(getCards per list) → GET /lists/:id/cards × N
  └── getBoardMembers(boardId)            → GET /boards/:boardId/members
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
              ├── accessToken  → Redux + localStorage
              └── refreshToken → localStorage

4. GỌI API BẢO VỆ
   Axios interceptor → header: Authorization: Bearer <accessToken>

5. LÀM MỚI TOKEN (tự động)
   Khi nhận 401 → POST /auth/refresh {refreshToken}
       ← 200 {accessToken mới}
   Các request đang chờ được retry tự động

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
  │  :5173       │     │  :3000       │     │  :5432       │
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
| **Phase 1** | Frontend kết nối API thật (bỏ mock data hoàn toàn) | ✅ Hoàn thành |
| **Phase 2** | Lists CRUD API + Frontend | ✅ Hoàn thành |
| **Phase 2** | Cards CRUD API + Frontend (title, desc, priority, due date, assignee) | ✅ Hoàn thành |
| **Phase 2** | Drag & Drop (UI only, chưa persist vào DB) | 🔄 Một phần |
| **Phase 2** | Labels (7 endpoints + full picker UI) | ✅ Hoàn thành |
| **Phase 3** | Comments (threaded, edit, delete, reply) + CTE bug fix | ✅ Hoàn thành |
| **Phase 3** | Activity Logs (auto-log + board/card feed UI) | ✅ Hoàn thành |
| **Phase 3** | Attachments & file upload (MinIO, cover image) | ✅ Hoàn thành |
| **Phase 3** | Card completion toggle (`is_completed`) | ✅ Hoàn thành |
| **Phase 3** | Board invitation (token-based email flow, 2 luồng) | ✅ Hoàn thành |
| **Phase 3** | Security hardening (hashed tokens, Redis blacklist, rotation) | ✅ Hoàn thành |
| **Phase 3** | Checklists | ⏳ Chưa implement |
| **Phase 4** | Notifications SSE (assign, comment, due date reminder) | ✅ Hoàn thành |
| **Phase 4** | Unread badge + dropdown (mark read, mark all, delete) | ✅ Hoàn thành |
| **Phase 5** | Reactive Activity Stream — Phase 1 Foundation | ✅ Hoàn thành |
| **Phase 5** | Reactive Activity Stream — Phase 2 UX (scroll pill, highlight, badge) | ⏳ Chưa implement |
| **Phase 5** | Reactive Activity Stream — Phase 3 Resilience (batching, reconnect) | ⏳ Chưa implement |
