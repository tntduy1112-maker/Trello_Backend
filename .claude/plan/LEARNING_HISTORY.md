# Learning History — TaskFlow Project

---

## 7 tháng 4, 2026 — Khởi động dự án & Thiết kế hệ thống

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Kết quả |
|---|---|---|
| 1 | Setup môi trường PostgreSQL 16 bằng Docker | Tạo `docker-compose.yml` với service `postgres:16`, volume persist data, expose port 5432 |
| 2 | Thiết kế dự án TaskFlow — Trello-style app | Viết `PROJECT_DESCRIPTION.md`: kiến trúc, 11 tính năng, phân quyền, tech stack, 4 phase |
| 3 | Thiết kế toàn bộ database schema | Viết `DATABASE_DESIGN.md`: 11 bảng, ERD, indexes, kế hoạch migrate theo phase |

### Đã làm

- **Khởi tạo môi trường phát triển:** Tạo `docker-compose.yml` để chạy PostgreSQL 16 local — đây là bước đầu tiên setup infrastructure cho toàn bộ dự án.
- **Lên ý tưởng & thiết kế dự án:** Xác định rõ sản phẩm cần xây dựng là **TaskFlow** — ứng dụng quản lý công việc theo phong cách Kanban (tương tự Trello).
- **Viết tài liệu thiết kế hệ thống:**
  - `PROJECT_DESCRIPTION.md` — Mô tả đầy đủ tính năng, kiến trúc, tech stack, và kế hoạch triển khai theo 4 phase.
  - `DATABASE_DESIGN.md` — Thiết kế toàn bộ schema PostgreSQL gồm 11 bảng chính.

### Đã học

#### Kiến trúc Multi-tenant Workspace
- Hệ thống phân cấp dữ liệu: `Users → Organizations → Boards → Lists → Cards`
- Phân quyền 2 tầng độc lập: quyền cấp **Workspace** (owner/admin/member) và quyền cấp **Board** (owner/admin/member/viewer)
- Dùng bảng junction `organization_members` và `board_members` để quản lý role linh hoạt

#### Thiết kế Database PostgreSQL
- Dùng **UUID** (`gen_random_uuid()`) làm primary key thay vì integer — an toàn hơn, không tiết lộ thứ tự dữ liệu
- Dùng kiểu **FLOAT** cho cột `position` ở `lists` và `cards` — cho phép chèn phần tử vào giữa mà không cần cập nhật lại toàn bộ danh sách (thay vì integer sequential)
- Dùng **JSONB** cho `activity_logs.metadata` — lưu dữ liệu bổ sung linh hoạt (giá trị cũ/mới khi thay đổi)
- **Denormalization có chủ đích:** cột `board_id` trong bảng `cards` và `activity_logs` là dữ liệu thừa nhưng tối ưu query performance
- Thiết kế **indexes** đúng chỗ: index composite cho `(board_id, position)`, `(list_id, position)`, index partial cho `due_date WHERE NOT NULL`

#### JWT Authentication Strategy
- Mô hình **Access Token + Refresh Token**: access token ngắn hạn (15 phút), refresh token dài hạn lưu DB
- Bảng `refresh_tokens` lưu trạng thái `is_revoked` — hỗ trợ logout từng thiết bị hoặc tất cả thiết bị (multi-device session)
- Bảng `email_verifications` dùng chung cho 2 loại flow: `verify_email` và `reset_password`

---

## 9 tháng 4, 2026 — Backend Phase 1 + Frontend scaffold + Bug fix

### Yêu cầu cụ thể đã đặt ra

#### Backend

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Xây dựng module Auth | Register, Login, Refresh Token, Logout, Get Me, Verify Email, Resend Verification, Forgot Password, Reset Password | 9 API endpoints, validate bằng Joi, bcrypt hash password, JWT dual-token |
| 2 | Xây dựng module Organizations | CRUD workspace + quản lý thành viên (invite by email, update role, remove member) | 9 API endpoints, phân quyền owner/admin/member, slug auto-generate |
| 3 | Xây dựng module Boards | CRUD board (visibility: private/workspace/public), archive, quản lý members 4 role | 8 API endpoints, `mergeParams: true` để nhận `orgId` từ parent router |
| 4 | Viết SQL migration | Tạo tất cả bảng và indexes cho Phase 1 | `migrations/001_init.sql` — 6 bảng + đầy đủ indexes |
| 5 | Tích hợp Swagger | Swagger UI tự động tắt trên production, chỉ bật khi `SWAGGER_ENABLED=true` | Cấu hình qua `configs/swagger.js`, mount tại `/api-docs` |
| 6 | Setup Email | Gửi email xác minh + reset password qua Nodemailer + Gmail SMTP | `utils/email.js` với template HTML |
| 7 | Viết Dockerfile | Build image Node.js production-ready | Multi-step hoặc single-step Dockerfile với `node:18-alpine` |
| 8 | Viết docker-compose production | Tách biệt hoàn toàn với dev — không expose port DB | `docker-compose.prod.yml` |
| 9 | Viết release script | Tự động build + tag `vX.Y.Z` và `latest` + push Docker Hub | `scripts/release.sh` với bash |
| 10 | Viết README | Hướng dẫn đầy đủ cho developer mới | Setup guide, env config, API overview, Docker commands |

#### Frontend — Scaffold & Planning

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 11 | Khởi tạo Frontend project | Vite + React 18 + Tailwind CSS + Redux Toolkit | Project structure đầy đủ với eslint, postcss, vite config |
| 12 | Viết FRONTEND_DESCRIPTION.md | Toàn bộ kiến trúc, màn hình, components, state management, routing | File mô tả 300+ dòng |
| 13 | Xây dựng Auth pages | Login, Register, Verify Email, Forgot Password, Reset Password | 5 pages hoàn chỉnh với form validation nội bộ |
| 14 | Xây dựng Workspace pages | Danh sách workspace, tạo workspace, boards trong workspace, settings | 4 pages |
| 15 | Xây dựng Board page | Kanban board layout (placeholder, chưa có DnD) | `BoardPage.jsx` |
| 16 | Setup Redux store | authSlice (user, token, isAuthenticated), boardSlice, notificationSlice | `redux/store.js` + 3 slices với mock data để dev |
| 17 | Setup Axios instance | Base URL từ env, JWT interceptor tự động attach header, auto redirect `/login` khi 401 | `api/axiosInstance.js` |
| 18 | Xây dựng UI components | Atomic components tái sử dụng | Button, Input, Modal, Avatar, AvatarStack, Badge, Dropdown, ColorPicker, NotificationDropdown, ProgressBar, Spinner, Tooltip |
| 19 | Xây dựng Layout components | Skeleton layout cho toàn app | AppLayout, AuthLayout, Navbar, Sidebar |
| 20 | Xây dựng Custom hooks | Logic tái sử dụng | useAuth, useBoard, useClickOutside, useDebounce, usePermission |
| 21 | Xây dựng Service layer | Hàm gọi API theo domain | auth, board, card, list, notification, workspace services |
| 22 | Setup Routing | Protected routes + Public routes với Redux auth state | `App.jsx` — 11 routes, ProtectedRoute + PublicRoute wrapper |
| 23 | Setup Mock data | Dữ liệu giả cho dev (không cần backend chạy) | `data/mockData.js` — authSlice khởi tạo với `mockUser` và `isAuthenticated: true` |

#### Bug Fix

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 24 | Fix màu chữ trang Đăng ký | "Font color chữ ở trang Tạo Tài khoản khó thấy quá" — kèm screenshot | Cập nhật Tailwind classes: label `text-gray-800`, input `text-gray-900`, placeholder `placeholder-gray-400` — đảm bảo contrast đủ trên nền trắng |

### Đã học

#### Backend Architecture Pattern
- **Module-based structure:** mỗi domain (`auth`, `organizations`, `boards`) có đủ `route → controller → service → model` — dễ scale, dễ maintain
- **Separation of concerns rõ ràng:**
  - `model.js` — SQL queries thuần, không business logic
  - `service.js` — business logic, orchestrate nhiều model calls
  - `controller.js` — xử lý HTTP request/response, gọi service
- **Express `mergeParams: true`:** cho phép router con truy cập params của router cha (ví dụ: `boards.route.js` đọc được `:orgId` từ organizations router)
- **Joi validation middleware:** tách validate schema ra khỏi controller, dùng `validate(schema)` làm middleware trước controller handler

#### Frontend Architecture & Patterns
- **Phân tầng state management** theo loại dữ liệu:
  - Server state (API data) → **React Query** (caching, background refetch, invalidation)
  - Global UI state → **Redux Toolkit** (auth session, notification state)
  - Form state → validation nội bộ với `useState` trước, sau nâng lên React Hook Form + Zod
  - Local state → `useState` / `useReducer`
- **Mock data strategy:** authSlice khởi tạo `isAuthenticated: true` với mock user để toàn bộ frontend có thể chạy và phát triển mà không cần backend sẵn sàng
- **Axios interceptor pattern:** request interceptor attach JWT, response interceptor xử lý 401 → auto redirect login — không cần xử lý lặp lại trong từng service
- **ProtectedRoute / PublicRoute wrapper:** component wrap kiểm tra Redux auth state, redirect phù hợp — sạch hơn so với check trong từng page
- **Custom hooks để đóng gói logic:** `usePermission`, `useClickOutside`, `useDebounce` — tái sử dụng được, tách logic ra khỏi UI

#### UX & CSS Accessibility
- **Text contrast trên form:** label dùng `text-gray-700` hoặc `text-gray-800`, input text dùng `text-gray-900`, placeholder dùng `placeholder-gray-400` — đảm bảo đọc được trên nền trắng/sáng
- Khi báo bug UI nên **kèm screenshot** để xác định chính xác vấn đề và component cần fix

#### Docker & DevOps
- Tách `docker-compose.yml` (dev, bao gồm DB volume) và `docker-compose.prod.yml` (production, không expose port DB ra ngoài)
- Release script tag cả version cụ thể (`v1.0.0`) lẫn `latest` để CI/CD pipeline luôn pull được image mới nhất

---

## 10 tháng 4, 2026 — Tổng kết & Lưu learning history

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Tóm tắt những gì đã làm ngày 7/4 và 9/4 | "pls summarize about what I have done and learned in 7th and 9th of April" | Claude đọc git log, plan files, source code → tạo `learning_history.md` |
| 2 | Lưu tóm tắt vào file | "save in @.claude/plan/ with file learning_history.md" | Tạo file tại `.claude/plan/learning_history.md` |
| 3 | Bổ sung chi tiết các yêu cầu đã đặt ra | "Please also go to details about what I have asked you to do so far in details request" | Claude đọc thêm toàn bộ source code (routes, components, fix notes) → cập nhật file với bảng yêu cầu chi tiết theo ngày |

---

---

## 14 tháng 4, 2026 — Kết nối API thật + Lists/Cards API + Card Detail persistence

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Chạy backend dev server | "@Backend/ run" | Xác nhận backend đang chạy port 3000 |
| 2 | Chạy frontend dev server | "@Frontend/ run" | Phát hiện port conflict (Vite mặc định 3000 trùng backend) → đổi sang 5173 trong `vite.config.js` |
| 3 | Kết nối toàn bộ API Backend vào Frontend | "kết nối API của Backend vào tất cả logic của Frontend" | Xóa toàn bộ mock data, kết nối 6 service files, cập nhật tất cả pages, thêm token refresh |
| 4 | Fix lỗi CORS | Kèm screenshot lỗi "Access-Control-Allow-Origin" | Cài `cors` npm, thêm `app.use(cors({...}))` vào `Backend/src/app.js` trước `express.json()` |
| 5 | Thêm chức năng mời thành viên workspace | Kèm screenshot WorkspaceSettings Members tab | Thêm inline invite form với email input + role selector + API call vào `WorkspaceSettingsPage.jsx` |
| 6 | Single assignee picker trong CardDetailModal | "chỉ có 1 thành viên được assign mà thôi" | Refactor từ multi-assignee → single assignee, dropdown chọn từ board members, checkmark hiển thị member đang được chọn |
| 7 | Nút "Lưu trữ card" lưu xuống DB | "validate 'Mô tả' phải có giá trị, sau đó lưu tất cả xuống DB" | Xây dựng toàn bộ Lists + Cards API (Backend), kết nối Frontend, validate description, gọi `PUT /cards/:cardId` |
| 8 | Push code lên GitHub | "push lên github" | Token cũ hết hạn → cập nhật PAT mới, push thành công commit `73e3c5d` |

---

### Chi tiết kỹ thuật đã làm

#### A. Kết nối Frontend với API thật (bỏ mock data)

**Vấn đề ban đầu:** Frontend dùng mock data (`isAuthenticated: true`, `mockUser`) — không gọi API thật nào cả.

**Những gì đã thay đổi:**

- **`api/axiosInstance.js`** — Sửa `baseURL` từ port 5000 → 3000/api/v1. Thêm **token refresh với request queue**: khi nhận 401, tự động gọi `POST /auth/refresh`, queue các request thất bại, retry sau khi refresh xong. Nếu refresh thất bại → xóa localStorage và redirect `/login`.
- **`redux/slices/authSlice.js`** — Xóa `mockUser`. Thêm `fetchMe` thunk (gọi `GET /auth/me`). `initialState` đọc token/user từ `localStorage`. `setCredentials` lưu vào `localStorage`. `fetchMe.rejected` xóa toàn bộ auth storage.
- **`redux/slices/workspaceSlice.js`** — Tạo mới hoàn toàn: `fetchWorkspaces`, `createWorkspaceThunk`, `updateWorkspaceThunk`, `deleteWorkspaceThunk`.
- **Tất cả service files** — Sửa đúng endpoint: `/organizations` thay vì `/workspaces`, `POST /organizations/:id/members` cho invite, v.v.
- **Tất cả pages** — LoginPage, RegisterPage, VerifyEmailPage, ResetPasswordPage, WorkspacesPage, BoardListPage, WorkspaceSettingsPage, CreateWorkspacePage, ProfilePage, BoardPage — đều dùng API thật.

#### B. Fix CORS

Backend thiếu header `Access-Control-Allow-Origin` → browser chặn request.

**Fix:** Cài `cors` npm package, thêm middleware trước `express.json()`:
```js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', ...env.CORS_ORIGINS],
  credentials: true,
}))
```
Quan trọng: `cors()` phải đứng **trước** tất cả routers.

#### C. Single Assignee trong CardDetailModal

**Quyết định thiết kế:** Mỗi card chỉ có **1 người được assign** tại một thời điểm (thay vì multi-assign).

**Implementation:**
- State `assignee` (single object, không phải array)
- `handleSelectMember`: nếu click member đang được chọn → bỏ assign; nếu click member khác → thay thế
- Dropdown đóng ngay sau khi chọn
- `UserX` button để bỏ assign trực tiếp
- Click outside → đóng dropdown (dùng `useRef` + `document.addEventListener`)

#### D. Lists + Cards API (Backend mới)

Xây dựng 2 modules mới theo đúng pattern `model → service → controller → route`:

**Lists API** (`Backend/src/modules/lists/`):
| Endpoint | Mô tả |
|---|---|
| `GET /boards/:boardId/lists` | Lấy tất cả lists của board (ordered by position) |
| `POST /boards/:boardId/lists` | Tạo list mới (position = max + 1) |
| `PUT /lists/:listId` | Đổi tên / cập nhật list |
| `DELETE /lists/:listId` | Xóa list |

**Cards API** (`Backend/src/modules/cards/`):
| Endpoint | Mô tả |
|---|---|
| `GET /lists/:listId/cards` | Lấy cards của list (kèm assignees qua JOIN) |
| `POST /lists/:listId/cards` | Tạo card mới |
| `GET /cards/:cardId` | Chi tiết card |
| `PUT /cards/:cardId` | Cập nhật card (title, description, priority, dueDate, assigneeId) |
| `DELETE /cards/:cardId` | Xóa card |

**Xử lý assignee trong card:** Dùng bảng `card_members`. Khi `PUT /cards/:cardId` nhận `assigneeId`:
1. Xóa toàn bộ `card_members` cũ (`DELETE FROM card_members WHERE card_id = $1`)
2. Nếu `assigneeId` không null → Insert mới vào `card_members`
3. Return card mới với JOIN `card_members + users`

#### E. Frontend kết nối Lists + Cards

**`boardSlice.js`** — Thêm các async thunks:
- `fetchBoardLists(boardId)` — Gọi `getLists`, rồi `Promise.all(getCards)` cho từng list song song
- `createListThunk({boardId, name})` — Tạo list qua API
- `createCardThunk({listId, title})` — Tạo card qua API
- `saveCardThunk({cardId, listId, data})` — Lưu toàn bộ card data
- `deleteCardThunk({cardId, listId})` — Xóa card qua API

**`BoardPage.jsx`** — Dispatch `fetchBoardLists(boardId)` song song với `fetchBoard(boardId)` khi mount. `handleAddList` dùng `createListThunk` thay vì tạo fake ID.

**`ListColumn.jsx`** — `handleAddCard` dispatch `createCardThunk` thay vì `addCard` với fake ID.

**`CardDetailModal.jsx`** — Nút "Lưu trữ card":
1. Check `description.trim()` không rỗng → hiện lỗi đỏ nếu trống
2. Nếu hợp lệ → gọi `saveCardThunk` với title, description, priority, dueDate, assigneeId
3. Loading spinner trên button khi đang lưu
4. Thành công → đóng modal

---

### Đã học

#### Token Refresh Race Condition
Khi nhiều request cùng nhận 401 cùng lúc → nếu không xử lý sẽ gọi refresh API nhiều lần → race condition. Pattern chuẩn:
```js
let isRefreshing = false
let failedQueue = []
// Nếu đang refresh → queue request lại
// Khi refresh xong → process toàn bộ queue
```

#### Position Strategy cho Lists/Cards
Dùng `FLOAT` thay vì `INTEGER` cho cột `position`:
- Khi thêm mới: `MAX(position) + 1`
- Khi kéo thả (DnD): tính `(positionBefore + positionAfter) / 2` — không cần update lại toàn bộ rows
- Khi số quá nhỏ (sau nhiều lần kéo): cần "rebalance" — reset lại position cho toàn list

#### Express Router Mounting Order
Khi có 2 routes overlap:
- `app.use('/api/v1/boards/:boardId', boardRouter)` — xử lý các subroutes của board
- `app.use('/api/v1/boards/:boardId/lists', boardListsRouter)` — xử lý riêng `/lists`

Express xử lý theo **thứ tự đăng ký**. Router đầu tiên match nhưng không có handler cho `/lists` thì `next()` → rơi xuống router thứ hai. Vì vậy đặt `boardRouter` trước vẫn hoạt động đúng.

#### `mergeParams: true` là bắt buộc cho nested routers
Khi router con cần đọc params từ router cha (ví dụ `boardListsRouter` cần đọc `:boardId`), phải khai báo `Router({ mergeParams: true })`. Nếu thiếu, `req.params.boardId` sẽ là `undefined`.

#### JOIN để lấy card members
Thay vì query riêng lẻ cho assignees, dùng `LEFT JOIN + json_agg + FILTER`:
```sql
json_agg(json_build_object('user_id', cm.user_id, 'full_name', u.full_name, ...))
FILTER (WHERE cm.user_id IS NOT NULL)
```
`FILTER (WHERE ...)` tránh bị `[null]` khi card chưa có assignee nào.

#### Personal Access Token (PAT) GitHub
GitHub không cho dùng password để push qua HTTPS từ 2021. Phải dùng PAT (Personal Access Token) với scope `repo`. Token được nhúng trực tiếp vào remote URL:
```
https://username:ghp_token@github.com/username/repo.git
```

---

---

## 15 tháng 4, 2026 — Labels full-stack + Bug fixes

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Implement Labels feature (full-stack) | Backend 7 endpoints + Frontend label picker trong CardDetailModal | Hoàn thành toàn bộ — tạo/sửa/xoá nhãn, toggle assign/unassign per card |
| 2 | Fix: checkbox nhãn không click được | Sau khi tạo nhãn mới, không thể gán vào card | Fix handleToggleLabel thành async + auto-assign sau create + đổi từ `<div>` sang `<button>` |
| 3 | Fix: 500 Internal Server Error khi gán nhãn | `POST /cards/:cardId/labels/:labelId` → `{"success":false,"message":"Internal server error"}` | Fix `json_agg(DISTINCT json_build_object(...))` → LATERAL subqueries trong `cards.model.js` |
| 4 | Push code lên GitHub | "push to github" | Push thành công commit `6e0253f` lên `tntduy1112-maker/Trello_Backend` |
| 5 | Update tài liệu `.claude/plan/` | "update các file md bên trong thư mục @.claude/plan/" | Cập nhật `learning_history.md`, `product_description.md`, `FRONTEND_DESCRIPTION.md`, `DATABASE_DESIGN.md` |

---

### Chi tiết kỹ thuật đã làm

#### A. Backend Labels Module (7 endpoints)

Tạo mới hoàn toàn `Backend/src/modules/labels/` theo đúng pattern `model → service → controller → route`:

| Endpoint | Mô tả |
|---|---|
| `GET /boards/:boardId/labels` | Lấy tất cả labels của board |
| `POST /boards/:boardId/labels` | Tạo label mới (tên + màu) |
| `PUT /labels/:labelId` | Cập nhật tên/màu label |
| `DELETE /labels/:labelId` | Xoá label (tự động gỡ khỏi tất cả cards) |
| `GET /cards/:cardId/labels` | Lấy labels đã gán cho card |
| `POST /cards/:cardId/labels/:labelId` | Gán label vào card |
| `DELETE /cards/:cardId/labels/:labelId` | Gỡ label khỏi card |

Mount 3 routers riêng biệt trong `app.js`:
```js
app.use('/api/v1/boards/:boardId/labels', boardLabelsRouter);
app.use('/api/v1/cards/:cardId/labels',   cardLabelsRouter);
app.use('/api/v1/labels/:labelId',        labelRouter);
```

#### B. Fix Bug: 500 Internal Server Error (`json_agg DISTINCT json`)

**Root cause:** `json_agg(DISTINCT json_build_object(...))` trong `cards.model.js` — PostgreSQL `json` type không có equality operator → không thể dùng `DISTINCT` trên `json`.

**Tại sao không bị phát hiện sớm hơn:** `fetchBoardLists` thunk swallow lỗi bằng `.catch(() => ({ listId, cards: [] }))` → board load bình thường nhưng cards luôn rỗng và không có error nào hiển thị ra UI.

**Fix:** Thay toàn bộ cross-product JOIN + DISTINCT bằng **LATERAL subqueries** trong cả `findCardsByListId` và `findCardById`:

```sql
-- Thay vì:
json_agg(DISTINCT json_build_object('id', lbl.id, ...))

-- Dùng LATERAL:
LEFT JOIN LATERAL (
  SELECT json_agg(json_build_object('id', lbl.id, 'name', lbl.name, 'color', lbl.color)) AS labels
  FROM card_labels cl JOIN labels lbl ON lbl.id = cl.label_id
  WHERE cl.card_id = c.id
) l ON true
```

Mỗi LATERAL chạy độc lập cho từng outer row → không tạo cross-product giữa `assignees` và `labels` → không cần DISTINCT.

#### C. Fix Bug: Checkbox nhãn không interactive

**Root cause (tầng 1):** `handleToggleLabel` là fire-and-forget — không có `.unwrap()`, không có error handling → khi API fail không có feedback nào.

**Root cause (tầng 2):** `<div onClick>` kém tin cậy hơn `<button>` cho click events trong một số trường hợp DOM nesting phức tạp.

**Fix:**
1. Đổi `handleToggleLabel` thành `async` với `.unwrap()` + try/catch + `setLabelError`
2. Thêm `togglingLabelId` state — spinner per label, disable row khi đang loading
3. Đổi label row từ `<div onClick>` sang `<button type="button" disabled={!!togglingLabelId}>`
4. Auto-assign sau create: `handleCreateLabel` gọi `addCardLabelThunk` ngay sau `createLabelThunk` resolve

#### D. Frontend label.service.js (file mới)

```js
import api from '../api/axiosInstance'
export const getBoardLabels   = (boardId) => api.get(`/boards/${boardId}/labels`)
export const createLabel      = (boardId, data) => api.post(`/boards/${boardId}/labels`, data)
export const updateLabel      = (labelId, data) => api.put(`/labels/${labelId}`, data)
export const deleteLabel      = (labelId) => api.delete(`/labels/${labelId}`)
export const getCardLabels    = (cardId) => api.get(`/cards/${cardId}/labels`)
export const addCardLabel     = (cardId, labelId) => api.post(`/cards/${cardId}/labels/${labelId}`)
export const removeCardLabel  = (cardId, labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`)
```

#### E. boardSlice.js — 6 thunks mới + `boardLabels` state

- `boardLabels: []` thêm vào `initialState` và `clearBoard` reducer
- `fetchBoardLabels(boardId)` — dispatch khi mount BoardPage
- `createLabelThunk({ boardId, name, color })` — thêm vào `boardLabels[]`
- `updateLabelThunk({ labelId, name, color })` — cập nhật label trong `boardLabels[]` và đồng bộ tên/màu trong tất cả cards
- `deleteLabelThunk(labelId)` — xoá khỏi `boardLabels[]` và gỡ khỏi tất cả cards trong store
- `addCardLabelThunk({ cardId, labelId, listId })` — backend trả về `labels[]` đầy đủ → cập nhật `card.labels` trong store
- `removeCardLabelThunk({ cardId, labelId, listId })` — tương tự

**Pattern quan trọng:** `cardInStore = useSelector(state => state.board.cards[listId]?.find(c => c.id === card?.id))` — lấy labels từ Redux store thay vì prop để UI cập nhật real-time sau mỗi thunk.

---

### Đã học

#### PostgreSQL: `json_agg(DISTINCT ...)` không hợp lệ
`json` type không có equality operator → không thể sort/dedup. Dùng `jsonb` nếu cần DISTINCT, hoặc tốt hơn là dùng **LATERAL subqueries** — không cần DISTINCT vì mỗi LATERAL chạy scope riêng biệt.

#### LATERAL subquery là pattern đúng cho 1-to-many aggregation trên cùng parent row
Khi cần aggregate 2+ quan hệ 1-to-many trên cùng một bảng cha (ví dụ: card có nhiều assignees VÀ nhiều labels), dùng JOIN thông thường sẽ tạo Cartesian product. LATERAL subquery chạy độc lập → kết quả chính xác, không cần DISTINCT.

#### Silent error swallowing là anti-pattern trong thunks
`.catch(() => fallbackValue)` trong thunk ẩn toàn bộ lỗi. Người dùng thấy UI "hoạt động" nhưng data thực ra rỗng/sai. Chỉ dùng fallback khi thực sự muốn ignore failure — nếu không, để error propagate hoặc `rejectWithValue`.

#### Auto-assign UX sau khi tạo mới
Khi user tạo label mới, expectation tự nhiên là label đó được assign ngay vào card đang mở. Chain thunk: `createLabelThunk` → `addCardLabelThunk` trong cùng một handler → không cần click thêm lần 2.

#### `<button type="button">` vs `<div onClick>`
Trong form context hoặc DOM nesting phức tạp, `<button>` nhận pointer events tin cậy hơn. Luôn thêm `type="button"` để tránh submit form vô tình. `disabled` attribute trên `<button>` hoạt động natively — không cần CSS pointer-events override.

---

## Tổng kết tiến độ (sau 15/4)

| Phase | Backend | Frontend |
|---|:---:|:---:|
| Phase 1 — Auth & Workspace | ✅ Done | ✅ Done (kết nối API thật) |
| Phase 2 — Lists & Cards | ✅ Done | ✅ Done (load, create, save, delete) |
| Phase 2 — Labels | ✅ Done (7 endpoints) | ✅ Done (full picker UI) |
| Phase 2 — DnD persist position | ✅ Ready (endpoint có sẵn) | ⏳ Chưa gọi PUT sau onDragEnd |
| Phase 3 — Comments | ✅ Done (4 endpoints) | ✅ Done (threaded UI) |
| Phase 3 — Activity Logs | ✅ Done (2 endpoints) | ✅ Done (Activity tab) |
| Phase 3 — Attachments | ✅ Done (4 endpoints + MinIO) | ✅ Done (upload/download/cover) |
| Phase 3 — Board Invitations | ✅ Done (token-based email flow) | ✅ Done (AcceptInvitePage) |
| Phase 3 — Card Completion | ✅ Done (is_completed toggle) | ✅ Done (visual feedback) |
| Phase 3 — Security hardening | ✅ Done (hashed tokens, blacklist, rotation) | ✅ Done (interceptor queue) |
| Phase 4 — Notifications | ⏳ Chưa bắt đầu | ⏳ Chưa bắt đầu |

**Bước tiếp theo:** DnD persist position (gọi `PUT /cards/:cardId` và `PUT /lists/:listId` với position mới sau `onDragEnd`). Hoặc Phase 4 — Real-time Notifications với WebSocket/SSE.

---

---

## 16 tháng 4, 2026 — Activity Logs, Comments, Board Invitations, Card Completion, Attachments, Security Hardening

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Implement Activity Logs + Comments (full-stack) | Backend modules + Frontend tab trong CardDetailModal | Activity Logs: 2 endpoints, fire-and-forget logger; Comments: 4 endpoints, threaded 1-level nesting |
| 2 | Implement Board Invitation + Card Completion | Email invite flow cho cả user mới/cũ, toggle `is_completed` trên card | Board invitations: migration + 5 endpoints; Card completion: toggle UI + visual feedback |
| 3 | Implement Attachments (full-stack) | Upload lên MinIO, download, xóa, toggle cover image | 4 endpoints, multer memoryStorage, File System Access API, per-file spinner, toast |
| 4 | Security & Infrastructure hardening | Hashed refresh tokens, token blacklist (Redis), token rotation, MinIO setup | 3 migrations, tokenCrypto util (AES-256-GCM), redis config, storage util |
| 5 | Đổi tên docs về UPPER_CASE | Rename plan files cho consistent | `fffc620` — rename docs + move ARCHITECTURE.md |

---

### Chi tiết kỹ thuật đã làm

#### A. Activity Logs Module

**Backend `Backend/src/utils/activityLogger.js`** — fire-and-forget singleton:
```js
const logActivity = async ({ userId, entityType, entityId, boardId, action, metadata }) => {
  try { await query(INSERT INTO activity_logs ...) }
  catch (err) { console.error('[activityLogger] ...') } // never throws
}
```
**Nguyên tắc thiết kế:** logging failure không bao giờ được phá vỡ main request → `try/catch` nuốt mọi lỗi.

Hook vào `cards.service` (created/updated/deleted) và `lists.service` (created/deleted) với `action` string như `card.created`, `card.updated`, `list.created`.

**Endpoints:**
| Endpoint | Mô tả |
|---|---|
| `GET /boards/:boardId/activity` | Activity feed của cả board |
| `GET /cards/:cardId/activity` | Activity feed của card cụ thể |

**Frontend:** `fetchCardActivityThunk` trong `boardSlice`, `cardActivity[]` state, tab "Activity" trong `CardDetailModal`.

#### B. Comments Module (threaded 1 level)

**Backend `comments.model.js`** — LATERAL subquery để aggregate replies:
```sql
LEFT JOIN LATERAL (
  SELECT json_agg(r ORDER BY r.created_at) AS replies
  FROM comments r WHERE r.parent_id = c.id
) replies ON true
WHERE c.parent_id IS NULL  -- chỉ lấy top-level comments
```

**Quy tắc nesting:** chỉ cho phép 1 level — reply-to-reply bị reject ngay ở service layer:
```js
if (parent.parent_id) { throw new Error('Cannot reply to a reply') }
```

**Endpoints:**
| Endpoint | Mô tả |
|---|---|
| `GET /cards/:cardId/comments` | Lấy comments (kèm replies) |
| `POST /cards/:cardId/comments` | Tạo comment (hoặc reply với `parentId`) |
| `PUT /comments/:commentId` | Sửa comment (chỉ owner) |
| `DELETE /comments/:commentId` | Xóa comment (chỉ owner) |

**Frontend:** 4 thunks trong `boardSlice`, `cardComments[]` state với nested reply support. `CardDetailModal` có threaded UI với inline edit, delete, reply form, spinner per action.

#### C. Board Invitations Module

**Migration `002_board_invitations.sql`** — bảng `board_invitations` với `token`, `email`, `role`, `invited_by`, `expires_at`, `accepted_at`.

**2 luồng invite:**
- **User đã có tài khoản:** thêm trực tiếp vào `board_members`, gửi email thông báo `sendBoardAddedEmail`
- **User mới (email chưa trong DB):** tạo row `board_invitations` với UUID token, gửi email với link `sendBoardInvitationEmail`

**Endpoints:**
| Endpoint | Mô tả |
|---|---|
| `POST /boards/:boardId/invite` | Invite member (2 luồng tự động) |
| `GET /boards/:boardId/invitations` | Lấy danh sách pending invitations |
| `DELETE /boards/:boardId/invitations/:invId` | Thu hồi lời mời |
| `GET /invitations/preview?token=` | Xem thông tin lời mời (public, không cần auth) |
| `POST /invitations/accept?token=` | Chấp nhận lời mời (cần auth, email phải khớp) |

**Frontend `AcceptInvitePage.jsx`:**
- Nếu chưa đăng nhập → redirect `/login?redirect=/accept-invite?token=...`
- `LoginPage` sau khi login thành công → đọc `redirect` query param → navigate về
- `RegisterPage` đọc `?email=` query param → pre-fill email field

#### D. Card Completion Toggle

Backend: cột `is_completed BOOLEAN DEFAULT false` trong bảng `cards`. `PUT /cards/:cardId` đã nhận field này.

Frontend:
- `CardDetailModal`: checkbox "Đánh dấu hoàn thành" với `is_completed` state, dispatch `saveCardThunk`
- `CardItem`: visual feedback — `line-through` title, opacity giảm, badge "Hoàn thành" màu xanh khi completed

#### E. Attachments Module (MinIO storage)

**Upload flow:**
1. Multer `memoryStorage()` — file không lưu disk, buffer trong RAM
2. Validate: size ≤ 10 MB, MIME type trong whitelist (images, PDF, Office docs, ZIP, text)
3. `uploadFile()` → MinIO `putObject` với UUID-prefixed object name → `getPublicUrl()`
4. INSERT vào bảng `attachments` với `object_name` để có thể xóa sau

**Endpoints:**
| Endpoint | Mô tả |
|---|---|
| `POST /cards/:cardId/attachments` | Upload file (multipart/form-data) |
| `GET /cards/:cardId/attachments` | Lấy danh sách attachments |
| `DELETE /cards/:cardId/attachments/:id` | Xóa attachment (owner hoặc board admin/owner) |
| `PATCH /cards/:cardId/attachments/:id/cover` | Toggle cover image |

**Cover image logic:** Chỉ file ảnh mới có thể set làm cover. Toggle: nếu đang là cover → unset; nếu không → set và đồng bộ `cards.cover_image_url`.

**Frontend download:** Dùng **File System Access API** (`showSaveFilePicker`) → fetch blob → write stream. Fallback: tạo anchor `<a download>` nếu browser không hỗ trợ. Per-file loading spinner, fade-in toast thành công.

**Frontend `CardItem.jsx`:** Hiển thị cover image ở đầu card nếu `card.cover_image_url` tồn tại. Badge attachment count từ `card.attachment_count` (tính bằng LATERAL subquery trong `cards.model.js`).

#### F. Security Hardening

**Migration 003 — Hashed Refresh Tokens:**
- Thêm cột `token_hash VARCHAR(64)` vào `refresh_tokens`
- Token gốc gửi cho client; hash SHA-256 lưu DB → nếu DB bị leak không thể dùng token gốc

**Migration 004 — Token Blacklist (Redis):**
- Bảng `token_blacklist(jti, expires_at)` trong PostgreSQL (backup)
- Redis làm primary store: `SET jti "1" EX <ttl>` — O(1) lookup, auto-expire

**`tokenCrypto.js` — AES-256-GCM encryption:**
```js
// Format: [iv 24 hex][authTag 32 hex][ciphertext n hex]
const encrypt = (plaintext) => { ... } // 96-bit IV, GCM auth tag
const decrypt = (ciphertext) => { ... } // throws nếu tampered
```

**Token rotation:** Mỗi khi dùng refresh token → issue token mới + revoke token cũ (một lần dùng). Phát hiện reuse → revoke toàn bộ family.

**`authenticate.js` middleware** cập nhật: verify JWT signature + check `jti` không trong blacklist (Redis lookup).

**`docker-compose.yml`** cập nhật: thêm service MinIO (S3-compatible) và Redis.

---

### Đã học

#### Fire-and-forget pattern cho logging
Logger dùng `try/catch` nuốt lỗi — một logging failure không bao giờ được interrupt main request. Đây là nguyên tắc: observability tools (logs, metrics, traces) là secondary concern, không được ảnh hưởng primary business logic.

#### Threaded comments với LATERAL subquery
Aggregate replies trong cùng một query bằng LATERAL — không cần N+1 queries. Enforce nesting limit ở service layer (không phải DB) để linh hoạt thay đổi sau.

#### Token-based invitation flow (2 luồng)
- User tồn tại → add trực tiếp, email thông báo (no token needed)
- User mới → UUID token, email với link, accept flow cần verify email khớp với token
- `preview` endpoint public (không cần auth) → frontend có thể hiển thị thông tin board trước khi user đăng nhập

#### Refresh token security: hash + rotation + blacklist
3 lớp bảo vệ:
1. **Hash in DB:** `SHA-256(token)` lưu DB → DB leak không dùng được token
2. **Rotation:** mỗi refresh → issue token mới, revoke cũ → replay attack bất khả thi
3. **Blacklist (Redis):** logout → `jti` vào blacklist; access token ngắn hạn nhưng vẫn bị revoke ngay

#### MinIO là S3-compatible object storage tự host
- API giống AWS S3 (dùng `minio` npm SDK)
- `memoryStorage()` với multer → không cần disk space, phù hợp container
- Object name = `folder/uuid-originalname` → unique, không conflict
- `getPublicUrl()` cho CDN-style access; `getPresignedUrl()` cho private files với expiry

#### File System Access API cho download
```js
const handle = await window.showSaveFilePicker({ suggestedName: filename })
const writable = await handle.createWritable()
await writable.write(blob)
await writable.close()
```
Browser native save dialog — không cần tên file hardcode. Fallback anchor download cho Firefox/Safari chưa hỗ trợ.

---

---

## 17 tháng 4, 2026 — Reactive Activity Stream (Phase 1) + Bug Fix: Comment Avatar

### Yêu cầu cụ thể đã đặt ra

| # | Yêu cầu | Chi tiết yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Phân tích & đề xuất product logic | Screenshot Card Detail modal + PM proposal về Reactive Activity Stream | Phân tích 7 gaps trong PM spec, đề xuất kiến trúc SSE topic routing, presence registry, Type B batching server-side, optimistic temp-ID swap |
| 2 | Implement Reactive Activity Stream Phase 1 | "yes" (implement proposal) | 5 file thay đổi: notificationSender, activityLogger, boardSlice, useNotificationStream, CardDetailModal |
| 3 | Fix bug: Comment avatar hiển thị "?" | Screenshot comment vừa post hiện avatar "?" thay vì "DT" | Fix `createComment` và `updateComment` trong `comments.model.js` dùng CTE JOIN |

---

### Chi tiết kỹ thuật đã làm

#### A. Reactive Activity Stream — Phase 1 Foundation

**Vấn đề:** Card Detail modal fetch activity 1 lần khi mở, không cập nhật khi teammate thay đổi card.

**Giải pháp:** Tái dụng kênh SSE hiện có (1 kết nối duy nhất per user), thêm `topic` field để phân biệt event loại.

**Backend — `notificationSender.js`:**
```js
const broadcastCardActivity = async (boardId, activityRow) => {
  const result = await query('SELECT user_id FROM board_members WHERE board_id = $1', [boardId])
  const payload = { topic: 'card_activity', ...activityRow }
  result.rows.forEach(({ user_id }) => pushSSE(String(user_id), payload))
}
```
Fan-out tới tất cả board members đang kết nối — không cần kênh mới.

**Backend — `activityLogger.js`:**
Thay `INSERT ... RETURNING *` (chỉ có raw row) bằng CTE:
```sql
WITH inserted AS (INSERT INTO activity_logs ... RETURNING *)
SELECT i.*, json_build_object('full_name', u.full_name, 'avatar_url', u.avatar_url) AS "user"
FROM inserted i LEFT JOIN users u ON u.id = i.user_id
```
Trả về row đầy đủ trong 1 query, rồi gọi `broadcastCardActivity` fire-and-forget.

**Frontend — `boardSlice.js`:**
- Thêm `openCardId: null` vào state
- `setOpenCardId(cardId)` — set khi modal mở, clear khi đóng
- `injectCardActivity(event)` — prepend vào `cardActivity[]` nếu:
  1. `event.entity_id === openCardId` (đúng card đang mở)
  2. `event.id` chưa có trong array (de-dup)

**Frontend — `useNotificationStream.js`:**
```js
if (data.topic === 'card_activity') {
  dispatch(injectCardActivity(data))
} else {
  dispatch(addNotification(data))
}
```
Topic routing trên 1 EventSource duy nhất — không thêm kết nối.

**Frontend — `CardDetailModal.jsx`:**
```js
useEffect(() => {
  if (isOpen && card?.id) {
    dispatch(setOpenCardId(card.id))
    // ... fetch comments, activity, attachments
  } else {
    dispatch(setOpenCardId(null))
  }
}, [isOpen, card?.id, dispatch])
```

#### B. Bug Fix: Comment Avatar "?" Placeholder

**Root cause:** `createComment` và `updateComment` trong `comments.model.js` dùng `RETURNING *` — trả về raw row không có `user` object. Frontend render `c.user?.full_name` → `undefined` → Avatar fallback `"?"`.

`findByCardId` (GET) thì có JOIN đầy đủ, nhưng CREATE/UPDATE thì không → mất nhất quán.

**Fix:** Đổi cả 2 hàm sang CTE:
```sql
-- createComment
WITH inserted AS (INSERT INTO comments ... RETURNING *)
SELECT i.*, json_build_object('id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url) AS "user"
FROM inserted i LEFT JOIN users u ON u.id = i.user_id

-- updateComment
WITH updated AS (UPDATE comments SET ... WHERE id = $1 RETURNING *)
SELECT u.*, json_build_object(...) AS "user"
FROM updated u LEFT JOIN users usr ON usr.id = u.user_id
```
Kết quả: cả 3 operations (GET, CREATE, UPDATE) trả về cùng shape → Avatar render đúng ngay khi post.

---

### Đã học

#### Tái dụng kênh SSE với topic routing thay vì mở kết nối mới
Thay vì mở EventSource thứ 2 cho card activity, thêm `topic` field vào payload và route trong hook:
- `card_activity` → `injectCardActivity`
- others → `addNotification`
Không thêm kết nối, không thêm endpoint, zero client-side complexity.

#### `openCardId` là "scope guard" cho live injection
`injectCardActivity` phải check `state.openCardId === event.entity_id` trước khi prepend. Nếu không, events từ các card khác (cùng board) sẽ lẫn vào activity list của card đang xem.

#### CTE là pattern chuẩn cho INSERT/UPDATE cần trả về enriched data
3 lần dùng CTE trong project này (activityLogger, createComment, updateComment) — cùng một pattern:
```sql
WITH cte AS (mutation RETURNING *)
SELECT cte.*, join_data FROM cte LEFT JOIN related_table ...
```
Một round-trip, data đầy đủ, không cần query riêng sau mutation.

#### Inconsistency giữa GET và CREATE response là nguồn gốc avatar bug
`findByCardId` JOIN user → có `user` object. `createComment` RETURNING * → không có. Frontend dùng cùng render code cho cả 2 → lỗi chỉ thấy khi tạo mới (optimistic state), không thấy khi reload (data từ GET). Loại lỗi này khó debug vì GET hoạt động đúng.

**Rule:** Mọi mutation endpoint trả về entity đều phải trả về cùng shape với GET endpoint của entity đó.
