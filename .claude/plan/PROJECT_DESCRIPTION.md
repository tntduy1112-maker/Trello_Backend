# TaskFlow — Ứng dụng Quản lý Công việc (Trello-style)

> **Stack:** Node.js | PostgreSQL 16 | JWT Authentication | Multi-tenant Workspace

---

## Tổng quan

**TaskFlow** là ứng dụng quản lý công việc theo phong cách Kanban board (tương tự Trello), cho phép các nhóm/tổ chức cộng tác, theo dõi và quản lý công việc hiệu quả theo thời gian thực.

---

## Kiến trúc hệ thống

```
Users
  └── Organizations (Workspaces)
        └── Boards
              └── Lists (Columns)
                    └── Cards (Tasks)
                          ├── Checklists
                          ├── Comments
                          ├── Attachments
                          └── Labels
```

---

## Chức năng chi tiết

### 1. Xác thực & Quản lý người dùng
- Đăng ký tài khoản bằng email + mật khẩu (mã hóa bcrypt)
- Đăng nhập trả về JWT Access Token + Refresh Token
- Hỗ trợ đăng nhập đa thiết bị (multi-device session)
- Xác minh email qua OTP
- Đặt lại mật khẩu qua email
- Quản lý hồ sơ cá nhân (tên, avatar)

---

### 2. Workspace (Organizations)
- Tạo và quản lý nhiều workspace độc lập theo tổ chức/nhóm
- Mời thành viên vào workspace qua email
- Phân quyền 3 cấp trong workspace:

| Quyền | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem board | ✅ | ✅ | ✅ |

---

### 3. Boards
- Tạo nhiều board trong một workspace
- Tùy chỉnh giao diện: màu nền hoặc ảnh nền
- Kiểm soát quyền truy cập: `private` / `workspace` / `public`
- Lưu trữ (archive) board khi không còn sử dụng
- Phân quyền 4 cấp trong board:

| Quyền | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Thêm / xoá thành viên | ✅ | ✅ | ❌ | ❌ |
| Tạo / xoá list | ✅ | ✅ | ✅ | ❌ |
| Tạo / sửa card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

---

### 4. Lists (Cột Kanban)
- Tạo các cột trong board để phân loại công việc (VD: To Do, In Progress, Done)
- Kéo thả để sắp xếp lại thứ tự các cột
- Lưu trữ (archive) list

---

### 5. Cards (Công việc)
- Tạo task với tiêu đề và mô tả chi tiết (hỗ trợ Markdown)
- Kéo thả card giữa các list và sắp xếp thứ tự trong list
- Tùy chỉnh ảnh bìa / màu bìa cho card
- Đặt ngày đến hạn (due date) và bật nhắc nhở trước N phút
- Gán mức độ ưu tiên: `Low` / `Medium` / `High` / `Critical`
- Gán nhiều thành viên vào một card
- Đánh dấu card hoàn thành
- Lưu trữ (archive) card

---

### 6. Labels (Nhãn)
- Tạo nhãn màu tùy chỉnh theo từng board
- Gán nhiều label vào một card để phân loại

---

### 7. Checklists
- Thêm một hoặc nhiều checklist vào card
- Mỗi item trong checklist có thể:
  - Gán người phụ trách
  - Đặt deadline riêng
  - Đánh dấu hoàn thành và ghi lại thời điểm hoàn thành
- Sắp xếp thứ tự checklist và từng item bằng kéo thả

---

### 8. Comments
- Bình luận trực tiếp trên card (hỗ trợ Markdown)
- Reply comment để tạo thread thảo luận lồng nhau
- Chỉnh sửa comment sau khi đăng

---

### 9. Attachments (Đính kèm)
- Upload file đính kèm vào card
- Hỗ trợ mọi loại file (ảnh, tài liệu, v.v.)
- Đặt ảnh đính kèm làm ảnh bìa của card
- Lưu thông tin file: tên, URL, loại MIME, dung lượng

---

### 10. Activity Logs (Nhật ký hoạt động)
- Tự động ghi lại mọi hành động trên hệ thống
- Theo dõi: ai đã làm gì, trên đối tượng nào, vào thời điểm nào
- Lưu trữ dữ liệu bổ sung (giá trị cũ/mới khi thay đổi) dưới dạng JSONB

---

### 11. Notifications (Thông báo)
- Tự động gửi thông báo khi:
  - Được giao việc (assign vào card)
  - Sắp đến deadline
  - Được mention trong comment
  - Có comment mới trên card đang theo dõi
- Đánh dấu đã đọc từng thông báo hoặc tất cả

---

## Kế hoạch triển khai

### Phase 1 — Core Foundation
- [ ] Xác thực: đăng ký, đăng nhập, refresh token, xác minh email
- [ ] Quản lý Organizations & thành viên
- [ ] Quản lý Boards & thành viên

### Phase 2 — Board Features
- [ ] Lists & Cards (CRUD + drag-drop)
- [ ] Gán thành viên vào card
- [ ] Labels & card labels

### Phase 3 — Advanced Card Features
- [ ] Checklists & checklist items
- [ ] Comments (bao gồm thread reply)
- [ ] Attachments

### Phase 4 — Monitoring & Notifications
- [ ] Activity logs
- [ ] Notification system

---

## Cấu trúc thư mục

```
src/
├── configs/
│   └── postgres.js
├── modules/
│   ├── auth/
│   │   ├── auth.route.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── auth.model.js
│   ├── organizations/
│   ├── boards/
│   ├── lists/
│   ├── cards/
│   ├── comments/
│   └── notifications/
├── middlewares/
│   ├── authenticate.js    ← Xác thực JWT
│   ├── authorize.js       ← Kiểm tra role/permission
│   └── validate.js
├── utils/
│   ├── jwt.js
│   ├── bcrypt.js
│   └── response.js
└── app.js
```

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js |
| Database | PostgreSQL 16 |
| Authentication | JWT + Refresh Token |
| Mã hóa mật khẩu | bcrypt |
| Container | Docker / Docker Compose |
| Pattern | Multi-tenant Workspace |
