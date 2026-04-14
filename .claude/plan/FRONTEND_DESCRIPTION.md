# TaskFlow — Frontend Description

> **Stack:** React 18 | JavaScript (JSX) | Tailwind CSS | Redux Toolkit | React Query | React DnD

---

## Tổng quan

Frontend của **TaskFlow** là SPA (Single Page Application) theo phong cách Kanban board (tương tự Trello). Giao tiếp với Backend qua REST API, hỗ trợ kéo thả, real-time UI update, và quản lý phân quyền theo vai trò.

---

## Kiến trúc thư mục

```
frontend/
├── node_modules/
├── public/
├── src/
│   ├── api/                  ← Backend Connection (axios instance, interceptors)
│   ├── assets/               ← Static Files (hình ảnh, icon, font)
│   ├── components/           ← Reusable Components
│   │   ├── layout/           ← AppLayout, AuthLayout, Sidebar, Navbar
│   │   └── ui/               ← Button, Modal, Avatar, Badge, Dropdown...
│   ├── context/              ← Global State Management (React Context)
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── data/                 ← Static Content (constants, mock data, enums)
│   ├── hooks/                ← Custom Logic (useAuth, useBoard, useDnD...)
│   ├── pages/                ← Application Pages (route-level components)
│   │   ├── auth/
│   │   ├── workspaces/
│   │   ├── boards/
│   │   └── profile/
│   ├── redux/                ← Advanced State Management (Redux Toolkit)
│   │   ├── store.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── boardSlice.js
│   │       └── notificationSlice.js
│   ├── services/             ← Frontend Logic (API call functions)
│   │   ├── auth.service.js
│   │   ├── board.service.js
│   │   ├── card.service.js
│   │   └── workspace.service.js
│   ├── utils/                ← Utility Functions (date format, color, permission)
│   ├── App.jsx
│   └── index.html
├── eslint.config.js
├── package-lock.json
└── .gitignore
```

### Vai trò từng thư mục

| Thư mục | Vai trò |
|---|---|
| `api/` | Cấu hình axios, base URL, JWT interceptor, auto refresh token |
| `assets/` | File tĩnh: ảnh, icon SVG, font |
| `components/layout/` | Skeleton layout dùng lại (AppLayout, AuthLayout) |
| `components/ui/` | Atomic UI: Button, Input, Modal, Spinner, Avatar... |
| `context/` | React Context cho auth session và notification state |
| `data/` | Hằng số, enums (PRIORITY, ROLE), dữ liệu tĩnh |
| `hooks/` | Custom hooks bọc logic tái sử dụng |
| `pages/` | Một component per route, gọi service và render UI |
| `redux/` | Redux Toolkit store + slices cho state phức tạp |
| `services/` | Hàm gọi API theo từng domain (gọi từ pages / hooks) |
| `utils/` | Hàm tiện ích thuần túy (format date, map priority → color) |

---

## Màn hình & Tính năng

### 1. Xác thực (Auth)

| Trang | Route | Mô tả |
|---|---|---|
| Đăng nhập | `/login` | Form email + mật khẩu, JWT lưu vào httpOnly cookie hoặc localStorage |
| Đăng ký | `/register` | Form tạo tài khoản mới |
| Xác minh email | `/verify-email` | Nhập OTP gửi qua email |
| Quên mật khẩu | `/forgot-password` | Nhập email để nhận link reset |
| Đặt lại mật khẩu | `/reset-password` | Nhập mật khẩu mới qua token |

---

### 2. Workspace (Organizations)

| Trang | Route | Mô tả |
|---|---|---|
| Danh sách workspace | `/` | Trang chủ sau đăng nhập, liệt kê tất cả workspace |
| Tạo workspace | `/workspaces/new` | Form tạo workspace mới |
| Cài đặt workspace | `/workspaces/:slug/settings` | Chỉnh tên, logo, quản lý thành viên |

**Components:**
- `WorkspaceCard` — hiển thị workspace trong danh sách
- `InviteMemberModal` — mời thành viên qua email
- `MemberList` — danh sách thành viên + badge role (Owner / Admin / Member)
- `RoleBadge` — hiển thị role với màu tương ứng

---

### 3. Boards

| Trang | Route | Mô tả |
|---|---|---|
| Danh sách board | `/workspaces/:slug` | Tất cả board trong workspace |
| Board detail | `/board/:boardId` | Giao diện Kanban chính |
| Cài đặt board | `/board/:boardId/settings` | Tên, visibility, members |

**Components:**
- `BoardCard` — thumbnail board (màu nền hoặc ảnh nền)
- `CreateBoardModal` — tạo board mới, chọn màu/ảnh nền
- `BoardHeader` — thanh header board (tên, visibility badge, nút invite)
- `BoardBackground` — render màu hoặc ảnh nền board

---

### 4. Kanban Board (Lists & Cards)

Đây là màn hình trung tâm của ứng dụng.

**Layout:**
```
BoardHeader
└── BoardCanvas (horizontal scroll)
      ├── ListColumn
      │     ├── ListHeader (tên + nút archive)
      │     ├── CardList (droppable)
      │     │     └── CardItem (draggable)
      │     └── AddCardButton
      └── AddListButton
```

**Drag & Drop:**
- Kéo thả **card** giữa các list (cập nhật `position` và `list_id`)
- Kéo thả **list** để sắp xếp lại thứ tự trong board
- Dùng thư viện `@dnd-kit/core` hoặc `react-beautiful-dnd`
- Optimistic update: cập nhật UI ngay lập tức, rollback nếu API lỗi

**Components:**
- `ListColumn` — một cột Kanban
- `CardItem` — card rút gọn (tiêu đề, cover, label, due date, assignees, priority)
- `AddCardInline` — thêm card nhanh trực tiếp trong list

---

### 5. Card Detail Modal

Mở overlay modal khi click vào card, không navigate sang trang mới.

**Sections trong modal:**
| Section | Mô tả |
|---|---|
| Cover | Hiển thị màu/ảnh bìa, nút đổi cover |
| Title | Chỉnh sửa inline |
| Description | Editor Markdown (react-markdown + textarea) |
| Members | Avatar stacked, nút assign/unassign |
| Labels | Badge màu, nút thêm/xoá label |
| Due Date | Date picker + indicator trạng thái (overdue / upcoming / done) |
| Priority | Dropdown: Low / Medium / High / Critical |
| Checklists | Accordion từng checklist, progress bar, thêm/xoá item |
| Attachments | Upload file, thumbnail ảnh, nút set làm cover |
| Comments | Thread comment, hỗ trợ Markdown, reply lồng nhau |
| Activity Log | Dòng thời gian các hành động trên card |

---

### 6. Labels

- **Label Picker** trong card modal: chọn/bỏ label, tạo label mới với color picker
- Label hiển thị dưới dạng badge màu trên `CardItem`

---

### 7. Checklists

- Thêm nhiều checklist vào một card
- Mỗi item: checkbox, nội dung, assigned user, due date
- Progress bar tổng hợp (X/Y items hoàn thành)
- Kéo thả để sắp xếp item và checklist

---

### 8. Comments

- Textarea hỗ trợ Markdown preview
- Hiển thị thread reply lồng nhau (2 cấp)
- Nút chỉnh sửa comment (chỉ owner)
- Relative timestamp (VD: "5 phút trước")

---

### 9. Notifications

- **Bell icon** trên navbar với badge số thông báo chưa đọc
- Dropdown hiển thị danh sách thông báo gần đây
- Click vào thông báo → navigate tới card/board liên quan
- Nút "Đánh dấu tất cả đã đọc"

---

### 10. Hồ sơ người dùng

| Trang | Route | Mô tả |
|---|---|---|
| Profile | `/profile` | Xem và chỉnh sửa thông tin cá nhân |
| Đổi mật khẩu | `/profile/security` | Form đổi mật khẩu |

---

## State Management

| Loại state | Giải pháp |
|---|---|
| Server state (API data) | React Query (`useQuery`, `useMutation`) |
| Global UI state | Zustand (auth session, sidebar open, active board) |
| Local component state | `useState` / `useReducer` |
| Form state | React Hook Form + Zod validation |

---

## API Integration

- Axios instance với base URL từ env, tự động attach JWT header
- Interceptor tự động refresh token khi nhận 401
- React Query làm cache layer, invalidate sau mỗi mutation

---

## Routing

```
/                          → Redirect dựa vào auth state
/login                     → AuthLayout
/register                  → AuthLayout
/verify-email              → AuthLayout
/forgot-password           → AuthLayout
/reset-password            → AuthLayout
/home                      → AppLayout — Danh sách workspace
/workspaces/new            → AppLayout — Tạo workspace
/workspaces/:slug          → AppLayout — Boards trong workspace
/workspaces/:slug/settings → AppLayout — Cài đặt workspace
/board/:boardId            → BoardLayout — Kanban board
/board/:boardId/settings   → BoardLayout — Cài đặt board
/profile                   → AppLayout — Profile
```

Protected routes kiểm tra auth token, redirect về `/login` nếu chưa đăng nhập.

---

## Phân quyền UI

- Ẩn/disable button dựa trên role của user trong workspace/board
- Hook `usePermission(resource, action)` trả về `boolean`
- Không render component nếu không có quyền (VD: ẩn "Delete Board" với member)

---

## Kế hoạch triển khai (theo giai đoạn)

### Phase 1 — Auth & Workspace
- [ ] Setup project (Vite + React + TypeScript + Tailwind)
- [ ] Auth pages (login, register, verify email, forgot/reset password)
- [ ] Workspace list & create
- [ ] Invite member modal

### Phase 2 — Board & Kanban
- [ ] Board list page
- [ ] Kanban board layout (lists + cards)
- [ ] Drag & drop lists và cards
- [ ] Create/archive list & card

### Phase 3 — Card Detail
- [ ] Card detail modal
- [ ] Labels, Members, Due Date, Priority
- [ ] Checklists & checklist items
- [ ] Attachments upload

### Phase 4 — Comments & Notifications
- [ ] Comment thread (Markdown + reply)
- [ ] Notification bell + dropdown
- [ ] Activity log trên card

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui hoặc Radix UI |
| Server state | React Query (TanStack Query v5) |
| Global state | Zustand |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit/core |
| Markdown | react-markdown + remark-gfm |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Icons | Lucide React |
| Date handling | date-fns |
| Container | Docker / Nginx |
