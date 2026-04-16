# TaskFlow — Ứng dụng Quản lý Công việc Theo Phong Cách Kanban

> **Stack:** Node.js + Express | React 18 + Redux Toolkit | PostgreSQL 16 | Redis | JWT Authentication | Multi-tenant Workspace

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Documentation](#api-documentation)
- [Database Design](#database-design)
- [Phân quyền (RBAC)](#phân-quyền-rbac)
- [Luồng xác thực](#luồng-xác-thực)
- [Trạng thái phát triển](#trạng-thái-phát-triển)

---

## Tổng quan

**TaskFlow** là ứng dụng quản lý công việc theo mô hình Kanban board (tương tự Trello), cho phép các nhóm/tổ chức cộng tác, theo dõi và quản lý công việc hiệu quả.

**Vấn đề giải quyết:**
- Teams mất thời gian và ngữ cảnh vì công việc nằm rải rác ở nhiều nơi — chat, spreadsheet, thỏa thuận miệng.
- Không có visibility chung: thành viên không biết người khác đang làm gì, có bị block gì không.
- Không có accountability: công việc bị bỏ quên vì không có người phụ trách rõ ràng.
- Không có workflow: công việc di chuyển phi chính thức, không qua các giai đoạn định nghĩa sẵn.

**Môi trường phát triển:**

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api-docs` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

---

## Tính năng

### Xác thực & Quản lý người dùng
- Đăng ký tài khoản bằng email + mật khẩu (bcrypt)
- Xác minh email qua OTP 6 chữ số (hết hạn 15 phút)
- Đăng nhập trả về JWT Access Token (15 phút) + Refresh Token (7 ngày, httpOnly cookie)
- Auto refresh token khi hết hạn — Axios interceptor với request queue chống race condition
- Đăng nhập đa thiết bị (multi-device session)
- Đặt lại mật khẩu qua email (link 1 giờ)
- Xem và cập nhật hồ sơ cá nhân

### Workspace (Organizations)
- Tạo và quản lý nhiều workspace độc lập theo tổ chức/nhóm
- Mời thành viên vào workspace qua email
- Phân quyền 3 cấp: `owner` / `admin` / `member`

### Boards
- Tạo nhiều board trong một workspace
- Tùy chỉnh màu nền cho board
- Kiểm soát quyền truy cập: `private` / `workspace` / `public`
- Mời thành viên vào board qua email
- Phân quyền 4 cấp: `owner` / `admin` / `member` / `viewer`

### Lists (Cột Kanban)
- Tạo các cột phân loại công việc (To Do, In Progress, Done, ...)
- Đổi tên list inline trực tiếp trên board
- Kéo thả để sắp xếp lại thứ tự các cột
- Xoá list (kéo theo toàn bộ cards)
- Position lưu dạng FLOAT — hỗ trợ insert O(1) không cần reindex

### Cards (Công việc)
- Tạo, sửa, xoá card
- Kéo thả card giữa các list và sắp xếp thứ tự
- Chỉnh sửa tiêu đề, mô tả, màu bìa inline trong modal
- Đặt ngày đến hạn (due date) — hiển thị màu đỏ nếu quá hạn
- Gán mức độ ưu tiên: `Low` / `Medium` / `High` / `Critical`
- Gán **một** thành viên phụ trách (single assignee — ownership rõ ràng)
- Lưu card với validation (mô tả không được để trống)

### Labels (Nhãn)
- Tạo nhãn màu tùy chỉnh theo từng board (tên + palette 10 màu)
- Gán nhiều label vào một card (checkbox toggle)
- Chỉnh sửa tên/màu nhãn inline trong card modal
- Xoá nhãn khỏi board (tự động gỡ khỏi tất cả cards)

### Comments
- Bình luận trực tiếp trên card, lưu xuống DB
- Reply comment (1 cấp)
- Chỉnh sửa comment inline (chỉ tác giả, hiển thị nhãn "(đã sửa)")
- Xóa comment (chỉ tác giả; nếu có replies, replies float up)

### Activity Logs
- Tự động ghi lại mọi hành động: ai làm gì, trên đối tượng nào, lúc nào
- Lưu giá trị cũ/mới dưới dạng JSONB (field-level diff)
- Fire-and-forget — lỗi log không ảnh hưởng main flow
- Tab **Hoạt động** trong Card Detail Modal

### Sắp ra mắt
- Checklists & checklist items
- Attachments & file upload
- Notification system
- Persist Drag & Drop position vào DB

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│   React 18  ·  Redux Toolkit  ·  React Router v7  ·  Tailwind  │
│                       Port: 5173 (dev)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP/REST  (Axios + JWT Bearer)
                          │  Base URL: http://localhost:3000/api/v1
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express API)                      │
│   Node.js 18+  ·  Express 4.18  ·  Joi Validation             │
│                                                                 │
│   Auth  ·  Organizations  ·  Boards  ·  Lists+Cards           │
│   Labels  ·  Comments  ·  Activity Logs                        │
│                                                                 │
│   Middlewares: authenticate.js · validate.js                   │
│   Utils: jwt.js · bcrypt.js · email.js · activityLogger.js    │
└──────────────┬───────────────────────────┬──────────────────────┘
               │  pg driver                │  ioredis
               ▼                           ▼
┌──────────────────────┐      ┌────────────────────────────┐
│   PostgreSQL 16       │      │   Redis 7 (Alpine)         │
│   Docker · port 5432  │      │   Docker · port 6379       │
│   Database: mydb      │      │   JWT blacklist · TTL auto │
└──────────────────────┘      └────────────────────────────┘
```

**Luồng xử lý request trong Backend:**

```
Request → Express Router → authenticate.js → validate.js → Controller → Service → Model → PostgreSQL
```

| Tầng | Trách nhiệm |
|---|---|
| Route | Định nghĩa endpoint, áp dụng middleware |
| Controller | Parse req/res, trả response |
| Service | Business logic, kiểm tra phân quyền |
| Model | Thực thi SQL query qua pg pool |

---

## Công nghệ sử dụng

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| Frontend Framework | React | 18.3.1 |
| Language | JavaScript (JSX) | — |
| State Management | Redux Toolkit | 2.3.0 |
| Client Routing | React Router | 7.1.1 |
| Drag & Drop | @dnd-kit/core + sortable | 6.x / 8.x |
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
| Cache / Blacklist | Redis | 7 (Alpine) |
| Containerization | Docker + Compose | — |

---

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js >= 18
- Docker & Docker Compose
- npm

### 1. Clone repository

```bash
git clone <repo-url>
cd Duy_AI_Plan
```

### 2. Khởi động PostgreSQL & Redis bằng Docker

```bash
cd Backend
docker-compose up -d
```

### 3. Cài đặt dependencies và cấu hình môi trường

```bash
# Backend
cd Backend
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin database, JWT secret, email SMTP, Redis
```

```bash
# Frontend
cd Frontend
npm install
```

### 4. Khởi tạo Database

```bash
# Chạy migration SQL
psql -U postgres -d mydb -f Backend/migrations/001_init.sql
```

### 5. Chạy ứng dụng

```bash
# Terminal 1 — Backend
cd Backend
npm run dev
# API chạy tại http://localhost:3000/api/v1
# Swagger UI tại http://localhost:3000/api-docs

# Terminal 2 — Frontend
cd Frontend
npm run dev
# App chạy tại http://localhost:5173
```

### Biến môi trường Backend (`.env`)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Token Encryption (AES-256-GCM)
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=TaskFlow <no-reply@taskflow.app>

# Frontend URL (for reset password links)
FRONTEND_URL=http://localhost:5173
```

---

## Cấu trúc thư mục

```
Duy_AI_Plan/
├── Backend/
│   ├── src/
│   │   ├── app.js                  ← Entry point, route mounting
│   │   ├── configs/
│   │   │   ├── env.js              ← Biến môi trường
│   │   │   ├── postgres.js         ← Connection pool PostgreSQL
│   │   │   ├── redis.js            ← Redis client (ioredis)
│   │   │   └── swagger.js          ← Swagger UI (dev)
│   │   ├── middlewares/
│   │   │   ├── authenticate.js     ← Xác thực JWT + Redis blacklist
│   │   │   └── validate.js         ← Validation Joi
│   │   ├── modules/
│   │   │   ├── auth/               ← 8 endpoints
│   │   │   ├── organizations/      ← 9 endpoints
│   │   │   ├── boards/             ← 10 endpoints
│   │   │   ├── lists/              ← 4 endpoints
│   │   │   ├── cards/              ← 5 endpoints
│   │   │   ├── labels/             ← 7 endpoints
│   │   │   ├── comments/           ← 4 endpoints
│   │   │   └── activityLogs/       ← 2 endpoints
│   │   └── utils/
│   │       ├── jwt.js
│   │       ├── bcrypt.js
│   │       ├── email.js
│   │       ├── tokenCrypto.js      ← AES-256-GCM encrypt/decrypt
│   │       ├── response.js
│   │       └── activityLogger.js   ← Fire-and-forget activity INSERT
│   ├── migrations/
│   │   └── 001_init.sql            ← Schema toàn bộ 15 bảng
│   ├── Dockerfile
│   ├── docker-compose.yml          ← PostgreSQL + Redis (dev)
│   └── docker-compose.prod.yml
│
└── Frontend/
    └── src/
        ├── api/
        │   └── axiosInstance.js    ← Axios + JWT interceptor + refresh queue
        ├── components/
        │   ├── layout/             ← AppLayout, Navbar, Sidebar
        │   ├── board/              ← ListColumn, CardItem, CardDetailModal
        │   └── ui/                 ← Button, Avatar, Modal, Dropdown, ...
        ├── pages/
        │   ├── auth/               ← Login, Register, VerifyEmail, ForgotPassword, Reset
        │   ├── workspaces/         ← WorkspacesPage, BoardListPage, Settings
        │   ├── boards/             ← BoardPage (Kanban canvas)
        │   └── profile/            ← ProfilePage
        ├── redux/
        │   ├── store.js
        │   └── slices/             ← authSlice, boardSlice, workspaceSlice
        ├── services/               ← API call functions (1 file per domain)
        └── hooks/                  ← useAuth, useBoard, usePermission, ...
```

---

## API Documentation

Swagger UI có sẵn tại `http://localhost:3000/api-docs` khi chạy ở môi trường development.

### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Mô tả |
|---|---|:---:|---|
| POST | `/register` | ❌ | Tạo tài khoản, gửi OTP email |
| POST | `/verify-email` | ❌ | Xác thực email bằng OTP 6 chữ số |
| POST | `/resend-verification` | ❌ | Gửi lại OTP (TTL 15 phút) |
| POST | `/login` | ❌ | Đăng nhập, nhận accessToken + refreshToken cookie |
| POST | `/refresh` | ❌ | Lấy accessToken mới từ refreshToken cookie |
| POST | `/logout` | ❌ | Revoke refreshToken, blacklist accessToken |
| GET | `/me` | ✅ | Thông tin user đang đăng nhập |
| POST | `/forgot-password` | ❌ | Gửi link reset mật khẩu vào email |
| POST | `/reset-password` | ❌ | Đổi mật khẩu, revoke tất cả tokens |

### Organizations (`/api/v1/organizations`)

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/` | Tạo workspace mới |
| GET | `/` | Danh sách workspaces của user |
| GET | `/:orgId` | Chi tiết workspace |
| PUT | `/:orgId` | Cập nhật workspace |
| DELETE | `/:orgId` | Xoá workspace (owner only) |
| GET | `/:orgId/members` | Danh sách thành viên |
| POST | `/:orgId/members` | Mời thành viên (by email) |
| PUT | `/:orgId/members/:userId` | Đổi role thành viên |
| DELETE | `/:orgId/members/:userId` | Xoá thành viên |

### Boards

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/organizations/:orgId/boards` | Tạo board mới |
| GET | `/organizations/:orgId/boards` | Danh sách boards |
| GET | `/boards/:boardId` | Chi tiết board |
| PUT | `/boards/:boardId` | Cập nhật board |
| DELETE | `/boards/:boardId` | Xoá board |
| GET | `/boards/:boardId/members` | Danh sách board members |
| POST | `/boards/:boardId/members` | Mời member vào board |
| PUT | `/boards/:boardId/members/:userId` | Đổi role |
| DELETE | `/boards/:boardId/members/:userId` | Xoá member |

### Lists, Cards, Labels, Comments

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/boards/:boardId/lists` | Danh sách / Tạo list |
| PUT/DELETE | `/lists/:listId` | Cập nhật / Xoá list |
| GET/POST | `/lists/:listId/cards` | Danh sách / Tạo card |
| GET/PUT/DELETE | `/cards/:cardId` | Chi tiết / Cập nhật / Xoá card |
| GET/POST | `/boards/:boardId/labels` | Danh sách / Tạo label |
| PUT/DELETE | `/labels/:labelId` | Cập nhật / Xoá label |
| GET/POST | `/cards/:cardId/labels` | Labels của card |
| DELETE | `/cards/:cardId/labels/:labelId` | Gỡ label khỏi card |
| GET/POST | `/cards/:cardId/comments` | Comments của card |
| PUT/DELETE | `/comments/:commentId` | Sửa / Xoá comment |
| GET | `/boards/:boardId/activity` | Activity feed của board |
| GET | `/cards/:cardId/activity` | Activity feed của card |

---

## Database Design

### Sơ đồ quan hệ

```
users
  ├── organization_members ──── organizations
  │                                   │
  ├── board_members ──── boards ───────┘
  │                         │
  │                         ├── lists
  │                         │      └── cards
  │                         │            ├── card_members ── users
  │                         │            ├── card_labels ─── labels
  │                         │            ├── checklists
  │                         │            ├── comments
  │                         │            └── attachments
  │                         └── labels
  │
  ├── refresh_tokens
  ├── email_verifications
  ├── activity_logs
  └── notifications
```

### Các bảng chính

| Bảng | Mô tả | Trạng thái API |
|---|---|:---:|
| `users` | Tài khoản người dùng | ✅ |
| `refresh_tokens` | JWT refresh token (lưu SHA-256 hash) | ✅ |
| `email_verifications` | OTP xác minh email / reset mật khẩu | ✅ |
| `organizations` | Workspace / tổ chức | ✅ |
| `organization_members` | Thành viên workspace (owner/admin/member) | ✅ |
| `boards` | Kanban board | ✅ |
| `board_members` | Thành viên board (owner/admin/member/viewer) | ✅ |
| `lists` | Cột Kanban (position: FLOAT) | ✅ |
| `cards` | Công việc (position: FLOAT, priority, due_date) | ✅ |
| `card_members` | Người được assign vào card (single assignee) | ✅ |
| `labels` | Nhãn màu của board | ✅ |
| `card_labels` | Gán nhãn vào card | ✅ |
| `comments` | Bình luận trên card (1-level thread) | ✅ |
| `activity_logs` | Lịch sử hành động (JSONB metadata) | ✅ |
| `checklists` | Checklist trong card | ⏳ |
| `checklist_items` | Item của checklist | ⏳ |
| `attachments` | File đính kèm | ⏳ |
| `notifications` | Thông báo người dùng | ⏳ |

**Thiết kế đáng chú ý:**
- `position` lưu dạng `FLOAT` cho cả `lists` và `cards` — insert O(1) giữa 2 phần tử mà không cần reindex
- `board_id` được denormalize vào `cards` và `activity_logs` để query nhanh mà không cần join phức tạp
- `card_members` giới hạn 1 assignee per card — ownership rõ ràng, không dàn trải trách nhiệm

---

## Phân quyền (RBAC)

Hai lớp phân quyền độc lập chồng lên nhau:

```
Workspace role (owner / admin / member)
    ↓ kiểm soát quyền truy cập board trong workspace
Board role (owner / admin / member / viewer)
    ↓ kiểm soát quyền hành động trên board
```

### Quyền hạn Workspace

| Quyền | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem boards | ✅ | ✅ | ✅ |

### Quyền hạn Board

| Quyền | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ | ❌ |
| Tạo / xoá list, card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

### Board Visibility

| Chế độ | Ai được xem |
|---|---|
| `private` | Chỉ board members |
| `workspace` | Tất cả workspace members |
| `public` | Bất kỳ ai có link |

---

## Luồng xác thực

```
1. ĐĂNG KÝ
   POST /auth/register → user được tạo + OTP gửi vào email (15 phút)

2. XÁC THỰC EMAIL
   POST /auth/verify-email {email, otp} → tài khoản được kích hoạt

3. ĐĂNG NHẬP
   POST /auth/login → { accessToken (15m) }
                    + Set-Cookie: refreshToken=<AES-256-GCM encrypted> (httpOnly, 7d)

4. GỌI API BẢO VỆ
   Authorization: Bearer <accessToken>
   authenticate.js kiểm tra:
     [1] JWT valid?
     [2] jti có trong Redis blacklist?
     [3] user.is_active AND iat >= tokens_valid_after?

5. AUTO REFRESH (Axios Interceptor)
   Khi nhận 401 → POST /auth/refresh (browser tự gửi cookie)
   → accessToken mới, refreshToken mới (rotation)
   → Retry toàn bộ request đang chờ

6. ĐĂNG XUẤT
   POST /auth/logout → revoke RT trong DB + blacklist AT jti vào Redis

7. ĐẶT LẠI MẬT KHẨU
   POST /auth/forgot-password → email chứa reset link (1 giờ)
   POST /auth/reset-password  → đổi mật khẩu + revoke TẤT CẢ sessions
```

**Bảo mật Refresh Token (defense in depth):**

| Lớp | Biện pháp | Mục đích |
|---|---|---|
| httpOnly cookie | Không đọc được từ JS | Chống XSS |
| SameSite=Lax | Hạn chế cross-site | Chống CSRF |
| AES-256-GCM encrypt | Cookie bị đánh cắp = vô dụng | Chống cookie theft |
| SHA-256 hash trong DB | DB bị dump = không dùng được | Chống DB leak |
| Token rotation | RT cũ bị dùng lại → nuke all sessions | Chống RT reuse |
| Redis jti blacklist | Logout tức thì, không chờ AT hết hạn | Instant revocation |
| `tokens_valid_after` | Mass revocation tất cả AT đang bay | Reset password / disable account |

---

## Trạng thái phát triển

| Phase | Tính năng | Backend | Frontend |
|---|---|:---:|:---:|
| **Phase 1** | Auth (register, login, OTP, JWT, reset password) | ✅ | ✅ |
| **Phase 1** | Organization CRUD + member management | ✅ | ✅ |
| **Phase 1** | Board CRUD + board member management | ✅ | ✅ |
| **Phase 2** | Lists CRUD | ✅ | ✅ |
| **Phase 2** | Cards CRUD (title, desc, priority, due date, assignee) | ✅ | ✅ |
| **Phase 2** | Drag & Drop UI (list + card reorder, card move) | — | ✅ |
| **Phase 2** | Persist DnD position vào DB | ✅ ready | ⏳ |
| **Phase 2** | Labels (7 endpoints + full picker UI) | ✅ | ✅ |
| **Phase 3** | Comments (threaded, edit, delete, reply) | ✅ | ✅ |
| **Phase 3** | Activity Logs (auto-log + board/card feed) | ✅ | ✅ |
| **Phase 3** | Checklists & checklist items | ⏳ | ⏳ |
| **Phase 3** | Attachments & file upload | ⏳ | ⏳ |
| **Phase 4** | Notifications system | ⏳ | ⏳ |

---

## License

MIT