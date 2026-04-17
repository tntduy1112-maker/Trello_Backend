# TaskFlow — Ứng dụng Quản lý Công việc (Trello-style)

> **Stack:** Node.js + Express | React 18 + Redux Toolkit | PostgreSQL 16 | JWT Authentication | MinIO (S3) | Redis | Multi-tenant Workspace

---

## Tổng quan

**TaskFlow** là ứng dụng quản lý công việc theo phong cách Kanban board (tương tự Trello), cho phép các nhóm/tổ chức cộng tác, theo dõi và quản lý công việc hiệu quả.

**Môi trường phát triển:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend API: `http://localhost:3000/api/v1`
- Database: PostgreSQL 16 trên Docker port `5432`
- Object Storage: MinIO trên Docker port `9000` (console `9001`)
- Cache / Blacklist: Redis trên Docker port `6379`

---

## Kiến trúc hệ thống

```
Users
  └── Organizations (Workspaces)
        └── Boards
              └── Lists (Columns)
                    └── Cards (Tasks)
                          ├── card_members (1 assignee)    ✅
                          ├── card_labels (many labels)    ✅
                          ├── Comments (1-level threaded)  ✅
                          ├── Attachments (MinIO)          ✅
                          ├── Activity Logs               ✅
                          └── Checklists                  ✅
      └── Notifications (SSE real-time)            ✅
```

---

## Chức năng chi tiết

### 1. Xác thực & Quản lý người dùng ✅ Hoàn thành

- Đăng ký tài khoản bằng email + mật khẩu (mã hóa bcrypt)
- Xác minh email qua OTP (6 chữ số, hết hạn sau 15 phút)
- Đăng nhập trả về JWT Access Token (15 phút) + Refresh Token (7 ngày)
- Auto refresh token khi hết hạn — Axios interceptor có request queue chống race condition
- Hỗ trợ đăng nhập đa thiết bị (multi-device session)
- Đặt lại mật khẩu qua email (link 1 giờ)
- Xem và cập nhật hồ sơ cá nhân (tên, avatar)
- **Security hardening:**
  - Refresh token hash (SHA-256) lưu DB — DB leak không dùng được token gốc
  - Token rotation mỗi lần dùng — replay attack bất khả thi
  - Token blacklist bằng Redis (`jti` → auto-expire) — logout revoke ngay lập tức

---

### 2. Workspace (Organizations) ✅ Hoàn thành

- Tạo và quản lý nhiều workspace độc lập theo tổ chức/nhóm
- Mời thành viên vào workspace qua email (user phải có tài khoản sẵn)
- Cập nhật và xoá workspace
- Phân quyền 3 cấp trong workspace:

| Quyền | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem board | ✅ | ✅ | ✅ |

---

### 3. Boards ✅ Hoàn thành

- Tạo nhiều board trong một workspace
- Tùy chỉnh màu nền cho board
- Kiểm soát quyền truy cập: `private` / `workspace` / `public`
- Mời thành viên vào board qua email — **2 luồng tự động:**
  - User đã có tài khoản → thêm trực tiếp + gửi email thông báo
  - User mới → gửi email với link token, accept flow xác minh email khớp
- Xem danh sách pending invitations, thu hồi lời mời
- Phân quyền 4 cấp trong board:

| Quyền | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Thêm / xoá thành viên | ✅ | ✅ | ❌ | ❌ |
| Tạo / xoá list, card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

---

### 4. Lists (Cột Kanban) ✅ Hoàn thành

- Tạo các cột trong board để phân loại công việc (VD: To Do, In Progress, Done)
- Đổi tên list inline trực tiếp trên board
- Kéo thả để sắp xếp lại thứ tự các cột — persist vị trí vào DB ngay sau khi thả, rollback nếu API lỗi
- Xoá list (kéo theo toàn bộ cards)
- Position lưu dạng FLOAT — hỗ trợ insert O(1) không cần reindex

---

### 5. Cards (Công việc) ✅ Hoàn thành

- Tạo card với tiêu đề
- Kéo thả card giữa các list và sắp xếp thứ tự — persist vị trí vào DB ngay sau khi thả, rollback nếu API lỗi
- Chỉnh sửa tiêu đề, mô tả inline trong modal
- Đặt ngày đến hạn (due date) — hiển thị màu đỏ nếu quá hạn
- Gán mức độ ưu tiên: `Low` / `Medium` / `High` / `Critical` — lưu ngay khi click, activity log tức thì, rollback nếu lỗi
- Gán **một** thành viên vào card (single assignee — ownership rõ ràng)
- **Đánh dấu hoàn thành** (`is_completed` toggle) — visual feedback: title gạch ngang, badge "Hoàn thành"
- Hiển thị ảnh bìa (cover image) từ attachment
- Badge `☑ X/Y` trên card trong board view — `checklist_progress` embed vào `findCardsByListId` query, ẩn khi `total = 0`
- Nút **"Lưu trữ card"**: validate mô tả không rỗng → lưu tất cả thông tin xuống DB
- Xoá card

---

### 6. Labels (Nhãn) ✅ Hoàn thành

- Tạo nhãn màu tùy chỉnh theo từng board (tên + palette 10 màu)
- Gán nhiều label vào một card để phân loại (checkbox toggle)
- Chỉnh sửa tên/màu nhãn inline trực tiếp trong card modal
- Xoá nhãn khỏi board (tự động gỡ khỏi tất cả cards)
- Nhãn hiển thị trên card trong board view và trong modal chi tiết
- Backend: 7 endpoints — GET/POST board labels, PUT/DELETE label, GET/POST/DELETE card labels
- Redux: `boardLabels[]` trong store, 6 thunks đồng bộ state toàn board

---

### 7. Checklists ✅ Hoàn thành

- Thêm một hoặc nhiều checklist vào card (tạo từ sidebar, tên tùy chỉnh)
- Đổi tên checklist inline — click vào tên để edit, Enter/Escape để lưu/hủy
- Xóa checklist (kéo theo toàn bộ items)
- Thêm item vào checklist — nhấn "+ Thêm mục", Enter để xác nhận
- Chỉnh sửa nội dung item inline — click vào text để edit
- Đánh dấu hoàn thành item — checkbox toggle, text gạch ngang khi done
- Xóa item — icon X hiện khi hover
- Progress bar hiển thị `completed/total` per checklist — xanh khi 100%
- Badge `☑ X/Y` hiển thị trên card trong board view (ẩn khi total = 0)
- Activity logging: `checklist.created`, `checklist.deleted`, `checklist_item.completed`, `checklist_item.uncompleted`
- `checklist_progress` được tính live từ DB và đồng bộ vào Redux sau mỗi thao tác
- Backend: 7 endpoints — `GET/POST /cards/:cardId/checklists`, `PUT/DELETE /checklists/:id`, `POST /checklists/:id/items`, `PUT/DELETE /checklist-items/:id`
- Redux: `cardChecklists[]` + `loadingChecklists` trong store, 7 thunks + `_syncChecklistProgress` helper
- **Phase 2 (chưa implement):** item assignee (`assigned_to`), item due date (`due_date`)

---

### 8. Comments ✅ Hoàn thành

- Bình luận trực tiếp trên card — lưu xuống DB, hiển thị real-time từ Redux
- Reply comment (1 cấp) — indent bên dưới comment gốc, phân cách bằng border-left
- Chỉnh sửa comment inline — chỉ tác giả mới sửa được, hiển thị nhãn "(đã sửa)"
- Xóa comment — chỉ tác giả
- Backend: 4 endpoints — GET/POST `/cards/:cardId/comments`, PUT/DELETE `/comments/:commentId`
- 1-level nesting guard: server từ chối reply-to-reply (400 Bad Request)
- Redux: `cardComments[]` + `loadingComments` trong store, 4 thunks đồng bộ state nested replies

---

### 9. Attachments (Đính kèm) ✅ Hoàn thành

- Upload file đính kèm vào card (ảnh, PDF, Office docs, ZIP, text — tối đa 10 MB)
- Lưu trữ trên **MinIO** (S3-compatible object storage tự host)
- Download file qua File System Access API (native save dialog) với fallback anchor
- Xoá attachment (owner hoặc board admin/owner); tự động xoá khỏi MinIO
- Đặt ảnh đính kèm làm **ảnh bìa** của card (chỉ file image)
- Badge attachment count hiển thị trên card trong board view
- Backend: 4 endpoints — GET/POST `/cards/:cardId/attachments`, DELETE `…/:id`, PATCH `…/:id/cover`

---

### 10. Activity Logs ✅ Hoàn thành

- Tự động ghi lại mọi hành động: ai làm gì, trên đối tượng nào, lúc nào
- Lưu giá trị metadata dưới dạng JSONB (field-level context)
- Fire-and-forget: `logActivity()` không bao giờ throw — lỗi log không ảnh hưởng main flow
- Hooks vào: `cards.service` (created/updated/deleted), `lists.service` (created/deleted), `comments.service` (added), `attachments.service` (added/deleted/cover), `checklists.service` (created/deleted, item completed/uncompleted)
- **Priority change logging:** priority được persist ngay khi click (không cần "Lưu trữ card") — backend detect diff, log `card.updated` với `changes[{ field: 'priority', oldValue, newValue }]`; duplicate click guard + rollback nếu API fail
- **Human-readable display:** `ACTION_LABEL` dịch priority sang tiếng Việt — *"đã đặt độ ưu tiên là Cao"* / *"đã đổi độ ưu tiên từ Trung bình sang Cao"*; có label riêng cho checklist và comment actions
- Backend: 2 endpoints — `GET /boards/:boardId/activity`, `GET /cards/:cardId/activity`
- Frontend: tab **Hoạt động** trong CardDetailModal; hiển thị avatar, tên, mô tả, relative time; real-time inject qua SSE (`injectCardActivity`)
- **Reactive UX (Phase 5.2):**
  - **Scroll-aware pill** — khi user cuộn xuống và có item mới inject, hiển thị pill "↑ N hoạt động mới"; click → smooth scroll về top + ẩn pill
  - **Highlight fade 3s** — item mới nhận class `animate-fade-highlight` (Tailwind keyframe blue glow → transparent trong 3s, `forwards`); ID tự xoá khỏi `newItemIds` Set sau 3s
  - **Tab badge** — khi tab "Hoạt động" không active mà có inject mới, badge count hiển thị trên tab button; reset khi chuyển sang tab activity
  - Detection pipeline: `prevActivityLenRef` làm baseline sau khi fetch hoàn tất (`activityReadyRef`), `useEffect` trên `cardActivity` tính delta → route đến pill / badge / highlight tùy `activeTabRef` + `isAtTopRef`

---

### 11. Notifications ✅ Hoàn thành

- Real-time push qua **SSE** (Server-Sent Events) — EventSource tự reconnect, token qua query param
- **3 loại trigger tự động:**
  - Card assigned → thông báo ngay tới assignee mới
  - Comment added → thông báo tới assignee của card (nếu khác commenter)
  - Due date reminder → cron job chạy mỗi giờ, tìm card sắp hết hạn trong 24h (dedup guard)
- Đánh dấu đã đọc từng thông báo hoặc tất cả (`read-all`)
- Xóa thông báo
- Unread count badge hiển thị trên bell icon ở Navbar
- `sendNotification()` fire-and-forget — lỗi không bao giờ ảnh hưởng main flow
- Backend: 5 endpoints — `GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/stream` (SSE), `PUT /:id/read`, `PUT /read-all`, `DELETE /:id`
- Redux: `notificationSlice` — 5 thunks + `addNotification` action (SSE inject)
- Hook `useNotificationStream` — mở SSE khi auth, đóng khi logout

---

## Kế hoạch triển khai

### Phase 1 — Core Foundation ✅ Hoàn thành
- [x] Xác thực: đăng ký, đăng nhập, OTP email, refresh token, reset password
- [x] Quản lý Organizations & thành viên (CRUD + invite by email)
- [x] Quản lý Boards & thành viên (CRUD + visibility + invite)
- [x] Frontend kết nối API thật (bỏ toàn bộ mock data)

### Phase 2 — Board Features ✅ Hoàn thành
- [x] Lists CRUD (tạo, đổi tên, xoá)
- [x] Cards CRUD (tạo, sửa title/description/priority/dueDate/assignee, xoá)
- [x] Single assignee per card (card_members)
- [x] Drag & Drop UI (list reorder, card reorder, card move between lists)
- [x] **Persist DnD vị trí vào DB** (`PUT /cards/:cardId` + `PUT /lists/:listId` với position mới) — snapshot-based rollback (pass `snapshot` qua rejectWithValue, reducer khôi phục state), `dndError` toast với `clearDndError`, `calcPosition()` guard, unified positioning strategy
- [x] Labels & card labels

### Phase 3 — Advanced Card Features ✅ Hoàn thành
- [x] Comments (threaded reply, edit, delete)
- [x] Activity logs (hooks vào cards, lists, comments, attachments)
- [x] Attachments & file upload (MinIO)
- [x] Card completion toggle (`is_completed`)
- [x] Board invitation (token-based email flow)
- [x] Security hardening (hashed tokens, Redis blacklist, token rotation)
- [x] Checklists & checklist items (create, rename, delete, add/edit/toggle/delete items, progress bar, board view pill)

### Phase 4 — Monitoring & Notifications ✅ Hoàn thành
- [x] Notification system (SSE real-time) — assign, comment, due date reminder
- [x] Unread badge + dropdown UI (mark read, mark all, delete)
- [x] Due date cron job (chạy mỗi giờ, dedup guard 24h)

### Phase 5 — Reactive Activity Stream 🔄 Đang thực hiện
- [x] **Phase 1 — Foundation:** `broadcastCardActivity()` phát SSE tới tất cả board members; `activityLogger` dùng CTE INSERT để lấy lại row kèm user info trong 1 query rồi broadcast ngay; `injectCardActivity` reducer với de-dup theo `event_id`; `useNotificationStream` định tuyến theo `topic`; `CardDetailModal` đăng ký `openCardId` khi mở/đóng
- [x] **Phase 2 — Core UX:** scroll-aware prepend vs. floating pill; highlight fade animation 3s; tab badge khi có activity mới
- [ ] **Phase 3 — Resilience:** Type B batching server-side; reconnect refetch; "Live updates paused" banner

---

## Cấu trúc thư mục

```
Duy_AI_Plan/
├── Backend/
│   ├── migrations/
│   │   ├── 001_init.sql               ← Schema gốc (11 bảng)
│   │   ├── 002_board_invitations.sql  ← board_invitations table
│   │   ├── 003_hash_refresh_tokens.sql← token_hash column
│   │   ├── 004_token_blacklist.sql    ← token_blacklist table
│   │   └── 005_attachments_cover.sql  ← cover_image_url, object_name
│   └── src/
│       ├── app.js                     ← Entry point, route mounting
│       ├── configs/
│       │   ├── postgres.js            ← pg connection pool
│       │   ├── env.js
│       │   ├── swagger.js
│       │   ├── minio.js               ← MinIO client + initBucket
│       │   └── redis.js               ← ioredis client
│       ├── modules/
│       │   ├── auth/                  ✅ 9 endpoints
│       │   ├── organizations/         ✅ 9 endpoints
│       │   ├── boards/                ✅ 10 endpoints
│       │   ├── lists/                 ✅ 4 endpoints
│       │   ├── cards/                 ✅ 5 endpoints
│       │   ├── labels/                ✅ 7 endpoints
│       │   ├── comments/              ✅ 4 endpoints
│       │   ├── activityLogs/          ✅ 2 endpoints
│       │   ├── attachments/           ✅ 4 endpoints
│       │   ├── checklists/            ✅ 7 endpoints (GET/POST card checklists, PUT/DELETE checklist, POST items, PUT/DELETE item)
│       │   ├── invitations/           ✅ 2 endpoints (preview + accept)
│       │   └── notifications/         ✅ 6 endpoints (list, count, stream SSE, read, read-all, delete)
│       ├── middlewares/
│       │   ├── authenticate.js        ← JWT verify + Redis blacklist check
│       │   └── validate.js            ← Joi schema validation
│       └── utils/
│           ├── jwt.js
│           ├── bcrypt.js
│           ├── email.js               ← Nodemailer + invite email templates
│           ├── response.js
│           ├── activityLogger.js      ← CTE INSERT → lấy row kèm user info → broadcastCardActivity
│           ├── storage.js             ← MinIO uploadFile/deleteFile/getPublicUrl
│           ├── tokenCrypto.js         ← AES-256-GCM encrypt/decrypt
│           ├── notificationSender.js  ← sendNotification (DB+SSE) + broadcastCardActivity (fan-out board members)
│           └── sseClients.js          ← In-memory SSE client registry (Map, userId → res)
│       └── jobs/
│           └── dueDateReminder.js     ← Cron mỗi giờ, gửi reminder 24h trước deadline
│
└── Frontend/
    └── src/
        ├── api/axiosInstance.js       ← Axios + JWT interceptor + refresh queue
        ├── hooks/
        │   └── useNotificationStream.js ← SSE hook; topic routing: card_activity → injectCardActivity
        ├── redux/slices/
        │   ├── authSlice.js           ✅ fetchMe, setCredentials
        │   ├── workspaceSlice.js      ✅ CRUD thunks
        │   ├── boardSlice.js          ✅ lists, cards, labels, comments, activity, attachments, checklists (44+ thunks)
        │   │                             + openCardId, setOpenCardId, injectCardActivity, _syncChecklistProgress
        │   │                             + dndError state, clearDndError action (snapshot rollback for DnD)
        │   └── notificationSlice.js   ✅ 5 thunks + addNotification (SSE)
        ├── services/                  ← API call functions (1 file per domain)
        ├── pages/
        │   ├── auth/                  ← Login, Register, VerifyEmail, ResetPassword
        │   ├── workspace/             ← WorkspaceList, BoardList, Settings, Create
        │   ├── board/                 ← BoardPage
        │   ├── profile/               ← ProfilePage
        │   └── invitations/           ← AcceptInvitePage
        └── components/
            ├── board/                 ← ListColumn, CardItem, CardDetailModal,
            │                            InviteMemberModal
            └── ui/                    ← Button, Avatar, Modal, Dropdown, …
```

---

## Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend Framework | React | 18.3.1 |
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
| File Upload | Multer (memoryStorage) | — |
| API Docs | Swagger UI Express | 5.0.1 |
| Database | PostgreSQL | 16 |
| Object Storage | MinIO (S3-compatible) | — |
| Cache / Blacklist | Redis (ioredis) | — |
| Containerization | Docker + Compose | — |
