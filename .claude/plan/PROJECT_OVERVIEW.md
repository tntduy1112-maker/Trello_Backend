# TaskFlow — Project Overview

> Ứng dụng quản lý công việc theo phong cách Kanban (Trello-style), xây dựng Full-Stack với Node.js + React.
> Dự án đã **hoàn thành toàn bộ** — 6 phases, 12 tính năng chính, production-ready.

---

## Thông tin dự án

| Mục | Chi tiết |
|---|---|
| **Tên dự án** | TaskFlow |
| **Mô hình** | Kanban board — Multi-tenant Workspace |
| **Trạng thái** | ✅ Hoàn thành |
| **Tổng phases** | 6 phases |
| **Backend** | Node.js + Express — 12 modules, 70+ endpoints |
| **Frontend** | React 18 SPA — 6+ slices, 44+ Redux thunks |
| **Repository** | https://github.com/tntduy1112-maker/Trello_Backend |

---

## Tech Stack

### Frontend
| Công nghệ | Mục đích |
|---|---|
| React 18 | UI framework |
| Redux Toolkit | Global state + async thunks |
| React Router v7 | Client-side routing |
| @dnd-kit | Drag & Drop (list + card reorder) |
| Axios | HTTP client + JWT interceptor + refresh queue |
| Tailwind CSS | Utility-first styling |
| Vite 6 | Build tool + dev server (:5173) |
| Lucide React | Icon library |
| react-markdown | Markdown rendering (HelpDrawer) |

### Backend
| Công nghệ | Mục đích |
|---|---|
| Node.js 18+ | Runtime |
| Express 4.18 | HTTP framework |
| Joi | Request validation |
| jsonwebtoken | Access / refresh token (JWT) |
| bcryptjs | Password hashing |
| Multer | File upload (memoryStorage) |
| Nodemailer | Email (OTP, invite, reset password) |
| Swagger UI | API documentation (dev) |

### Infrastructure
| Công nghệ | Mục đích |
|---|---|
| PostgreSQL 16 | Primary database (Docker :5432) |
| MinIO | S3-compatible object storage (Docker :9000) |
| Redis | Token blacklist + JWT revocation (Docker :6379) |
| Docker + Compose | Containerization |

---

## Kiến trúc hệ thống

```
Browser (React SPA :5173)
        │  REST/JSON (Axios + JWT Bearer)
        │  SSE EventSource (Notifications + Activity Stream)
        ▼
Express API (:3000)
  ├── authenticate.js  → JWT verify + Redis blacklist
  ├── validate.js      → Joi schema
  └── 12 modules       → Route → Controller → Service → Model
        │
        ├── PostgreSQL 16   (primary data)
        ├── MinIO            (file attachments + avatars)
        └── Redis            (JWT blacklist — jti TTL auto-expire)
```

### Mô hình dữ liệu
```
Users
  └── Organizations (Workspaces)
        ├── organization_members (owner | admin | member)
        └── Boards
              ├── board_members (owner | admin | member | viewer)
              ├── board_invitations (token-based email flow)
              ├── Labels
              └── Lists (Columns)
                    └── Cards (Tasks)
                          ├── card_members (single assignee)
                          ├── card_labels
                          ├── Checklists → checklist_items
                          ├── Comments (1-level threaded)
                          ├── Attachments (MinIO)
                          └── Activity Logs (JSONB metadata)
  └── Notifications (SSE real-time push)
```

---

## Tính năng đã hoàn thành

### 1. Xác thực & Bảo mật ✅
- Đăng ký + xác minh email OTP (6 chữ số, 15 phút)
- Đăng nhập → Access Token (JWT, 15 phút) + Refresh Token (7 ngày, httpOnly cookie)
- Refresh token rotation: mỗi lần dùng cấp token mới, token cũ bị revoke
- Refresh token reuse detection → nuke toàn bộ session user
- Token blacklist bằng Redis (jti, auto-expire) → logout có hiệu lực tức thì
- Refresh token hash SHA-256 lưu DB (raw token không bao giờ persist)
- AES-256-GCM encrypt cookie (raw JWT không bao giờ nằm trong cookie)
- Quên mật khẩu / đặt lại qua email (link 1 giờ, rate limit 5/15m/IP)
- Axios interceptor: auto-refresh 401 với request queue chống race condition

### 2. Cập nhật hồ sơ cá nhân ✅
- `PUT /auth/me` — Multer memoryStorage, fileFilter image/*, giới hạn 2MB
- Upload avatar lên MinIO, tự động xóa avatar cũ
- `updateProfileThunk` — multipart FormData, sync Redux + localStorage

### 3. Workspace (Organizations) ✅
- CRUD workspace + slug duy nhất
- Phân quyền 3 cấp: Owner / Admin / Member
- Mời thành viên bằng email, đổi role, xóa member

### 4. Boards ✅
- CRUD board + tùy chỉnh màu nền
- Visibility: `private` / `workspace` / `public`
- Phân quyền 4 cấp: Owner / Admin / Member / Viewer
- Invitation flow 2 luồng:
  - User đã có tài khoản → thêm trực tiếp + email thông báo
  - User mới → token-based email, accept flow xác minh email khớp

### 5. Lists (Cột Kanban) ✅
- CRUD list, đổi tên inline
- Kéo thả sắp xếp thứ tự list — persist vị trí vào DB, snapshot rollback nếu lỗi
- Position dạng FLOAT — insert O(1), không cần reindex

### 6. Cards (Công việc) ✅
- CRUD card, kéo thả giữa list và reorder trong list — persist + rollback
- Tiêu đề, mô tả, ngày đến hạn (đỏ nếu quá hạn), mức độ ưu tiên (4 cấp)
- Single assignee (card_members) — gán/bỏ gán ngay lập tức
- Đánh dấu hoàn thành (`is_completed`) — visual: line-through + badge
- Ảnh bìa (cover image) từ attachment
- Badge `☑ X/Y` trên card trong board view
- Priority change: persist ngay khi click (không cần Save), có activity log

### 7. Labels (Nhãn) ✅
- Tạo nhãn màu tùy chỉnh per-board (tên + 10 màu)
- Toggle assign/unassign nhiều label vào card
- Chỉnh sửa tên/màu inline, xóa nhãn (tự gỡ khỏi tất cả cards)
- 7 endpoints, Redux `boardLabels[]` với 6 thunks

### 8. Checklists ✅
- Nhiều checklist per card; đổi tên, xóa checklist
- Thêm/sửa/toggle/xóa checklist item
- Item assignee (avatar picker từ board members) + item due date
- Progress bar per checklist (xanh khi 100%)
- Badge `☑ X/Y` trên card trong board view (ẩn khi total = 0)
- 7 endpoints, 7 Redux thunks + `_syncChecklistProgress` helper

### 9. Comments ✅
- Bình luận + reply (1 cấp), chỉnh sửa + xóa (chỉ tác giả)
- Label "(đã sửa)", 1-level nesting guard tại server
- CTE JOIN để trả đủ user info khi tạo/sửa (không cần re-fetch)

### 10. Attachments (Đính kèm) ✅
- Upload (ảnh, PDF, Office, ZIP, text — tối đa 10MB) → MinIO
- Download: File System Access API (native save dialog) + fallback anchor
- Xóa attachment (owner / admin) → tự xóa khỏi MinIO
- Đặt ảnh bìa card (`PATCH …/cover`) — chỉ file image

### 11. Activity Logs ✅
- Tự động ghi mọi hành động (card, list, comment, attachment, checklist)
- JSONB metadata, fire-and-forget (`logActivity` không bao giờ throw)
- Human-readable display tiếng Việt (priority, checklist, comment actions)
- Tab "Hoạt động" trong CardDetailModal

### 12. Notifications ✅
- Real-time push qua SSE (EventSource tự reconnect, token qua query param)
- 3 trigger: card assigned, comment added, due date reminder (cron mỗi giờ, dedup 24h)
- Đánh dấu đọc từng thông báo / tất cả, xóa thông báo
- Unread count badge trên Navbar bell icon
- `sendNotification()` fire-and-forget

### 13. Reactive Activity Stream (Phase 5) ✅
- `broadcastCardActivity()` fan-out SSE tới toàn bộ board members
- `injectCardActivity` reducer với de-dup theo `event_id`
- Scroll-aware pill "↑ N hoạt động mới" khi có item mới inject
- Highlight fade 3s (`animate-fade-highlight`) cho item vừa inject
- Tab badge khi có activity mới nhưng tab không active
- Type B batching server-side (50ms window); "Kết nối gián đoạn" banner khi SSE reconnect

### 14. Help System (Phase 6) ✅
- `USER_GUIDE.md` — 12 sections tiếng Việt, phục vụ tĩnh từ `Frontend/public/`
- `HelpDrawer` — slide-in panel 500px, `react-markdown` với custom styled components
- TOC pills parse từ heading `## N. Title`, cuộn mượt đến section
- Navbar: icon `?` (HelpCircle) mở drawer toàn app
- CardDetailModal: `?` trên header + inline `?` per sidebar section với deep link

---

## Backend — Modules & Endpoints

| Module | Endpoint prefix | Endpoints |
|---|---|:---:|
| Auth | `/api/v1/auth` | 10 |
| Organizations | `/api/v1/organizations` | 9 |
| Boards | `/api/v1/boards` + `/organizations/:id/boards` | 10 |
| Lists | `/api/v1/lists` + `/boards/:id/lists` | 4 |
| Cards | `/api/v1/cards` + `/lists/:id/cards` | 5 |
| Labels | `/api/v1/labels` + `/boards/:id/labels` + `/cards/:id/labels` | 7 |
| Comments | `/api/v1/comments` + `/cards/:id/comments` | 4 |
| Activity Logs | `/api/v1/.../activity` | 2 |
| Attachments | `/api/v1/cards/:id/attachments` | 4 |
| Checklists | `/api/v1/checklists` + `/cards/:id/checklists` | 7 |
| Invitations | `/api/v1/invitations` | 2 |
| Notifications | `/api/v1/notifications` | 6 |
| **Tổng** | | **~70** |

---

## Frontend — Cấu trúc chính

```
src/
├── api/axiosInstance.js        ← Axios + JWT interceptor + refresh queue
├── components/
│   ├── layout/                 ← Navbar (help, notifications, avatar), Sidebar, AppLayout
│   ├── board/                  ← ListColumn, CardItem, CardDetailModal, InviteMemberModal
│   └── ui/                     ← Avatar, Badge, Dropdown, HelpDrawer, NotificationDropdown…
├── pages/
│   ├── auth/                   ← Login, Register, VerifyEmail, ForgotPassword, ResetPassword
│   ├── workspaces/             ← WorkspacesPage, BoardListPage, Settings, CreateWorkspace
│   ├── boards/                 ← BoardPage (Kanban + DnD), CreateBoardModal
│   ├── profile/                ← ProfilePage (avatar upload, tên)
│   └── invitations/            ← AcceptInvitePage
├── redux/slices/
│   ├── authSlice.js            ← fetchMe, setCredentials, updateProfileThunk
│   ├── boardSlice.js           ← 44+ thunks (lists, cards, labels, comments, attachments, checklists)
│   ├── workspaceSlice.js       ← CRUD thunks
│   └── notificationSlice.js   ← 5 thunks + addNotification (SSE)
├── hooks/
│   └── useNotificationStream.js ← SSE hook, topic routing (card_activity / notification)
└── services/                   ← 1 file per domain (auth, workspace, board, card, label…)
```

---

## Kế hoạch triển khai — Tóm tắt

| Phase | Nội dung | Trạng thái |
|---|---|:---:|
| **Phase 1** | Auth (register, OTP, login, JWT, reset), Workspace, Board, kết nối API thật | ✅ |
| **Phase 2** | Lists, Cards, Drag & Drop + persist, Labels | ✅ |
| **Phase 3** | Comments, Activity logs, Attachments, Card completion, Board invitations, Security hardening, Checklists | ✅ |
| **Phase 4** | Notifications SSE (assign, comment, due date reminder), Unread badge | ✅ |
| **Phase 5** | Reactive Activity Stream (Foundation → Core UX → Resilience) | ✅ |
| **Phase 6** | Profile Update (PUT /auth/me + MinIO avatar), Help System (HelpDrawer + USER_GUIDE.md) | ✅ |

---

## Tài liệu liên quan

| File | Nội dung |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Kiến trúc hệ thống, cấu trúc thư mục, modules, tech stack |
| [AUTH_FLOW.md](AUTH_FLOW.md) | Luồng xác thực chi tiết (sequence diagrams cho mọi endpoint auth) |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | Schema PostgreSQL — tất cả bảng, cột, ràng buộc, indexes |
| [PRODUCT_DESCRIPTION.md](PRODUCT_DESCRIPTION.md) | Mô tả tính năng chi tiết từ góc độ sản phẩm |
| [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md) | Mô tả tính năng + kế hoạch triển khai theo phase |
| [FRONTEND_DESCRIPTION.md](FRONTEND_DESCRIPTION.md) | Chi tiết frontend: routing, state, component, service layer |
| [USER_GUIDE.md](USER_GUIDE.md) | Hướng dẫn sử dụng end-user (12 sections tiếng Việt) |
| [UIUX_GUIDE.md](UIUX_GUIDE.md) | Design tokens, layout, component patterns |