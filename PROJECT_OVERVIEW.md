# Duy AI Project — TodoList App (Trello-style)

## Mô tả dự án

Ứng dụng quản lý công việc theo phong cách Trello, hỗ trợ làm việc nhóm theo mô hình **Multi-tenant Workspace**. Người dùng có thể tạo tổ chức (Organization), tạo các Board, chia cột (List) và quản lý công việc qua Card.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Database | PostgreSQL 16 |
| Authentication | JWT + Refresh Token |
| Backend | Node.js (Express) |
| Infra | Docker / Docker Compose |

---

## Tính năng chính

- **Xác thực:** Đăng ký, đăng nhập, xác minh email, đặt lại mật khẩu, refresh token
- **Workspace:** Tạo tổ chức, mời thành viên, phân quyền `owner / admin / member`
- **Board:** Tạo board riêng tư hoặc công khai trong workspace, phân quyền `owner / admin / member / viewer`
- **List & Card:** Kéo thả sắp xếp cột và thẻ công việc, đặt deadline, mức độ ưu tiên
- **Card Features:** Checklist, comment (thread), gán người, label, đính kèm file
- **Thông báo:** Realtime notification khi được giao việc, nhắc deadline, được mention
- **Activity Log:** Lịch sử toàn bộ thao tác trên board

---

## Kiến trúc dữ liệu

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

## Danh sách Tables (11 nhóm)

| # | Table | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản người dùng |
| 2 | `refresh_tokens` | JWT refresh token |
| 3 | `email_verifications` | OTP xác minh email / reset password |
| 4 | `organizations` | Workspace / tổ chức |
| 5 | `organization_members` | Thành viên workspace + phân quyền |
| 6 | `boards` | Bảng Kanban |
| 7 | `board_members` | Thành viên board + phân quyền |
| 8 | `lists` | Cột trong board (To Do / In Progress / Done...) |
| 9 | `cards` | Thẻ công việc |
| 10 | `card_members` | Người được giao việc |
| 11 | `labels` + `card_labels` | Nhãn màu cho card |
| 12 | `checklists` + `checklist_items` | Danh sách việc con trong card |
| 13 | `comments` | Bình luận trên card (hỗ trợ thread) |
| 14 | `attachments` | File đính kèm |
| 15 | `activity_logs` | Lịch sử hoạt động |
| 16 | `notifications` | Thông báo người dùng |

---

## Lộ trình phát triển

### Phase 1 — Core Foundation
- [ ] Xác thực người dùng (register, login, verify email, refresh token)
- [ ] Quản lý Organization & thành viên
- [ ] Quản lý Board & thành viên

### Phase 2 — Board Features
- [ ] Lists, Cards, Card Members
- [ ] Labels & Card Labels

### Phase 3 — Advanced Card Features
- [ ] Checklists & Checklist Items
- [ ] Comments & Attachments

### Phase 4 — Monitoring & Notifications
- [ ] Activity Logs
- [ ] Notifications

---

## Cấu trúc thư mục

```
src/
├── configs/
│   └── postgres.js
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── boards/
│   ├── lists/
│   ├── cards/
│   ├── comments/
│   └── notifications/
├── middlewares/
│   ├── authenticate.js
│   ├── authorize.js
│   └── validate.js
├── utils/
│   ├── jwt.js
│   ├── bcrypt.js
│   └── response.js
└── app.js
```

---

## Kết nối Database

```
Host:     localhost
Port:     5432
Database: mydb
Username: postgres
Password: postgres
```

```
postgresql://postgres:postgres@localhost:5432/mydb
```
