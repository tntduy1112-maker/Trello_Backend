# TaskFlow — Ứng dụng Quản lý Công việc (Trello-style)

> **Stack:** Node.js + Express | React 18 + Redux Toolkit | PostgreSQL 16 | JWT Authentication | Multi-tenant Workspace

---

## Tổng quan

**TaskFlow** là ứng dụng quản lý công việc theo phong cách Kanban board (tương tự Trello), cho phép các nhóm/tổ chức cộng tác, theo dõi và quản lý công việc hiệu quả.

**Môi trường phát triển:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend API: `http://localhost:3000/api/v1`
- Database: PostgreSQL 16 trên Docker port `5432`

---

## Kiến trúc hệ thống

```
Users
  └── Organizations (Workspaces)
        └── Boards
              └── Lists (Columns)
                    └── Cards (Tasks)
                          ├── card_members (1 assignee)
                          ├── card_labels (many labels)  ✅
                          ├── Checklists        ⏳
                          ├── Comments          ⏳
                          └── Attachments       ⏳
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
- Mời thành viên vào board qua email
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
- Kéo thả để sắp xếp lại thứ tự các cột (UI hoạt động, chưa persist vị trí vào DB)
- Xoá list (kéo theo toàn bộ cards)
- Position lưu dạng FLOAT — hỗ trợ insert O(1) không cần reindex

---

### 5. Cards (Công việc) ✅ Hoàn thành (core), ⏳ Một số tính năng đang phát triển

**Đã hoàn thành:**
- Tạo card với tiêu đề
- Kéo thả card giữa các list và sắp xếp thứ tự (UI hoạt động, chưa persist vị trí vào DB)
- Chỉnh sửa tiêu đề, mô tả, màu bìa inline trong modal
- Đặt ngày đến hạn (due date) — hiển thị màu đỏ nếu quá hạn
- Gán mức độ ưu tiên: `Low` / `Medium` / `High` / `Critical`
- Gán **một** thành viên vào card (single assignee — ownership rõ ràng)
- Nút **"Lưu trữ card"**: validate mô tả không rỗng → lưu tất cả thông tin xuống DB
- Xoá card

**Chưa implement:**
- ~~Markdown cho mô tả~~ (plain text hiện tại)
- ~~Nhắc nhở trước deadline N phút~~
- ~~Đánh dấu card hoàn thành (checkbox)~~

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

### 7. Checklists ⏳ Chưa implement

- Thêm một hoặc nhiều checklist vào card
- Mỗi item có thể gán người phụ trách, đặt deadline riêng, đánh dấu hoàn thành
- *(Bảng `checklists` và `checklist_items` đã có trong DB schema)*

---

### 8. Comments ⏳ Chưa implement

- Bình luận trực tiếp trên card
- Reply comment để tạo thread thảo luận lồng nhau
- *(Bảng `comments` đã có trong DB schema, UI placeholder đã có trong CardDetailModal)*

---

### 9. Attachments (Đính kèm) ⏳ Chưa implement

- Upload file đính kèm vào card
- Đặt ảnh đính kèm làm ảnh bìa của card
- *(Bảng `attachments` đã có trong DB schema)*

---

### 10. Activity Logs ⏳ Chưa implement

- Tự động ghi lại mọi hành động: ai làm gì, trên đối tượng nào, lúc nào
- Lưu giá trị cũ/mới dưới dạng JSONB
- *(Bảng `activity_logs` đã có trong DB schema)*

---

### 11. Notifications ⏳ Chưa implement

- Thông báo khi được assign vào card, sắp đến deadline, được mention trong comment
- Đánh dấu đã đọc từng thông báo hoặc tất cả
- *(Bảng `notifications` đã có trong DB schema)*

---

## Kế hoạch triển khai

### Phase 1 — Core Foundation ✅ Hoàn thành
- [x] Xác thực: đăng ký, đăng nhập, OTP email, refresh token, reset password
- [x] Quản lý Organizations & thành viên (CRUD + invite by email)
- [x] Quản lý Boards & thành viên (CRUD + visibility + invite)
- [x] Frontend kết nối API thật (bỏ toàn bộ mock data)

### Phase 2 — Board Features 🔄 Đang thực hiện
- [x] Lists CRUD (tạo, đổi tên, xoá)
- [x] Cards CRUD (tạo, sửa title/description/priority/dueDate/assignee, xoá)
- [x] Single assignee per card (card_members)
- [x] Drag & Drop UI (list reorder, card reorder, card move between lists)
- [ ] **Persist DnD vị trí vào DB** (`PUT /cards/:cardId` với position mới sau khi drop)
- [x] Labels & card labels

### Phase 3 — Advanced Card Features ⏳
- [ ] Checklists & checklist items
- [ ] Comments (bao gồm thread reply)
- [ ] Attachments & file upload

### Phase 4 — Monitoring & Notifications ⏳
- [ ] Activity logs (server-side triggers)
- [ ] Notification system

---

## Cấu trúc thư mục

```
Duy_AI_Plan/
├── Backend/
│   └── src/
│       ├── app.js                 ← Entry point, route mounting
│       ├── configs/
│       │   ├── postgres.js        ← pg connection pool
│       │   ├── env.js
│       │   └── swagger.js
│       ├── modules/
│       │   ├── auth/              ✅ 8 endpoints
│       │   ├── organizations/     ✅ 9 endpoints
│       │   ├── boards/            ✅ 10 endpoints
│       │   ├── lists/             ✅ 4 endpoints
│       │   ├── cards/             ✅ 5 endpoints
│       │   ├── labels/            ✅ 7 endpoints
│       │   ├── comments/          ⏳ chưa tạo
│       │   └── notifications/     ⏳ chưa tạo
│       ├── middlewares/
│       │   ├── authenticate.js    ← Xác thực JWT
│       │   └── validate.js        ← Joi schema validation
│       └── utils/
│           ├── jwt.js
│           ├── bcrypt.js
│           ├── email.js
│           └── response.js
│
└── Frontend/
    └── src/
        ├── api/axiosInstance.js   ← Axios + JWT interceptor + refresh queue
        ├── redux/slices/
        │   ├── authSlice.js       ✅ fetchMe, setCredentials
        │   ├── workspaceSlice.js  ✅ CRUD thunks
        │   ├── boardSlice.js      ✅ fetchBoard, fetchBoardLists, createList/Card, saveCard, deleteCard, labels (6 thunks)
        │   └── notificationSlice.js
        ├── services/              ← API call functions (1 file per domain)
        ├── pages/                 ← Auth, Workspace, Board, Profile pages
        └── components/
            ├── board/             ← ListColumn, CardItem, CardDetailModal
            └── ui/                ← Button, Avatar, Modal, Dropdown, …
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
| API Docs | Swagger UI Express | 5.0.1 |
| Database | PostgreSQL | 16 |
| Containerization | Docker + Compose | — |
