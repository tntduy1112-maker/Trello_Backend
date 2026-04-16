# 🗄️ Database Design — TodoList App (Trello-style)

> **Stack:** PostgreSQL 16 | **Auth:** JWT + Refresh Token | **Pattern:** Multi-tenant Workspace

---

## 📐 Tổng quan kiến trúc

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

## 🔐 1. Authentication & Users

### `users`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID người dùng |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| `full_name` | VARCHAR(255) | NOT NULL | Họ tên đầy đủ |
| `avatar_url` | TEXT | NULL | URL ảnh đại diện |
| `is_verified` | BOOLEAN | DEFAULT false | Xác minh email |
| `is_active` | BOOLEAN | DEFAULT true | Tài khoản đang hoạt động |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

### `refresh_tokens`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID token |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Chủ sở hữu token |
| `token` | TEXT | UNIQUE, NOT NULL | JWT refresh token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Thời điểm hết hạn |
| `is_revoked` | BOOLEAN | DEFAULT false | Token đã bị thu hồi |
| `device_info` | TEXT | NULL | Thông tin thiết bị |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

### `email_verifications`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người dùng |
| `token` | VARCHAR(64) | UNIQUE, NOT NULL | OTP / token xác minh |
| `type` | VARCHAR(50) | NOT NULL | `verify_email` / `reset_password` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Hết hạn |
| `used_at` | TIMESTAMPTZ | NULL | Thời điểm đã dùng |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

---

## 🏢 2. Organizations (Workspaces)

### `organizations`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID workspace |
| `name` | VARCHAR(255) | NOT NULL | Tên tổ chức |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| `description` | TEXT | NULL | Mô tả |
| `logo_url` | TEXT | NULL | Logo |
| `created_by` | UUID | FK → users.id | Người tạo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

### `organization_members` *(Phân quyền cấp Workspace)*
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `organization_id` | UUID | FK → organizations.id ON DELETE CASCADE | Workspace |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người dùng |
| `role` | VARCHAR(20) | NOT NULL | `owner` / `admin` / `member` |
| `invited_by` | UUID | FK → users.id | Người mời |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tham gia |

> **UNIQUE:** `(organization_id, user_id)`

#### Quyền hạn Workspace:
| Quyền | owner | admin | member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời/xoá member | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem board | ✅ | ✅ | ✅ |

---

## 📋 3. Boards

### `boards`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID board |
| `organization_id` | UUID | FK → organizations.id ON DELETE CASCADE | Thuộc workspace |
| `name` | VARCHAR(255) | NOT NULL | Tên board |
| `description` | TEXT | NULL | Mô tả |
| `cover_color` | VARCHAR(20) | DEFAULT '#0052CC' | Màu nền board |
| `cover_image_url` | TEXT | NULL | Ảnh nền board |
| `visibility` | VARCHAR(20) | DEFAULT 'private' | `private` / `workspace` / `public` |
| `is_archived` | BOOLEAN | DEFAULT false | Đã lưu trữ |
| `created_by` | UUID | FK → users.id | Người tạo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

### `board_members` *(Phân quyền cấp Board)*
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `board_id` | UUID | FK → boards.id ON DELETE CASCADE | Board |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người dùng |
| `role` | VARCHAR(20) | NOT NULL | `owner` / `admin` / `member` / `viewer` |
| `invited_by` | UUID | FK → users.id | Người mời |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tham gia |

> **UNIQUE:** `(board_id, user_id)`

#### Quyền hạn Board:
| Quyền | owner | admin | member | viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Thêm/xoá member | ✅ | ✅ | ❌ | ❌ |
| Tạo/xoá list | ✅ | ✅ | ✅ | ❌ |
| Tạo/sửa card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

---

## 📑 4. Lists (Columns)

### `lists`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID list |
| `board_id` | UUID | FK → boards.id ON DELETE CASCADE | Thuộc board |
| `name` | VARCHAR(255) | NOT NULL | Tên cột (VD: To Do, In Progress, Done) |
| `position` | FLOAT | NOT NULL | Thứ tự hiển thị (dùng float để drag-drop dễ) |
| `is_archived` | BOOLEAN | DEFAULT false | Đã lưu trữ |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

---

## 🃏 5. Cards (Tasks)

### `cards`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID card |
| `list_id` | UUID | FK → lists.id ON DELETE CASCADE | Thuộc list |
| `board_id` | UUID | FK → boards.id | Board (denormalized để query nhanh) |
| `title` | VARCHAR(500) | NOT NULL | Tiêu đề card |
| `description` | TEXT | NULL | Mô tả chi tiết (Markdown) |
| `position` | FLOAT | NOT NULL | Thứ tự trong list |
| `cover_color` | VARCHAR(20) | NULL | Màu bìa |
| `cover_image_url` | TEXT | NULL | Ảnh bìa |
| `due_date` | TIMESTAMPTZ | NULL | Ngày đến hạn |
| `due_reminder` | INTEGER | NULL | Nhắc trước N phút |
| `is_completed` | BOOLEAN | DEFAULT false | Đã hoàn thành |
| `is_archived` | BOOLEAN | DEFAULT false | Đã lưu trữ |
| `priority` | VARCHAR(20) | DEFAULT 'medium' | `low` / `medium` / `high` / `critical` |
| `created_by` | UUID | FK → users.id | Người tạo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

### `card_members` *(Người được giao việc)*
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `card_id` | UUID | FK → cards.id ON DELETE CASCADE | Card |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người được assign |
| `assigned_by` | UUID | FK → users.id | Người assign |
| `assigned_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày assign |

> **UNIQUE:** `(card_id, user_id)`

---

## 🏷️ 6. Labels

### `labels`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID label |
| `board_id` | UUID | FK → boards.id ON DELETE CASCADE | Thuộc board |
| `name` | VARCHAR(100) | NULL | Tên nhãn |
| `color` | VARCHAR(20) | NOT NULL | Mã màu HEX |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

### `card_labels`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `card_id` | UUID | FK → cards.id ON DELETE CASCADE | Card |
| `label_id` | UUID | FK → labels.id ON DELETE CASCADE | Label |

> **PRIMARY KEY:** `(card_id, label_id)`

---

## ✅ 7. Checklists

### `checklists`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID checklist |
| `card_id` | UUID | FK → cards.id ON DELETE CASCADE | Thuộc card |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề checklist |
| `position` | FLOAT | NOT NULL | Thứ tự |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

### `checklist_items`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID item |
| `checklist_id` | UUID | FK → checklists.id ON DELETE CASCADE | Thuộc checklist |
| `content` | TEXT | NOT NULL | Nội dung |
| `is_completed` | BOOLEAN | DEFAULT false | Đã hoàn thành |
| `position` | FLOAT | NOT NULL | Thứ tự |
| `assigned_to` | UUID | FK → users.id | Người phụ trách |
| `due_date` | TIMESTAMPTZ | NULL | Deadline item |
| `completed_at` | TIMESTAMPTZ | NULL | Thời điểm hoàn thành |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

---

## 💬 8. Comments

### `comments`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID comment |
| `card_id` | UUID | FK → cards.id ON DELETE CASCADE | Thuộc card |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người comment |
| `content` | TEXT | NOT NULL | Nội dung (Markdown) |
| `is_edited` | BOOLEAN | DEFAULT false | Đã chỉnh sửa |
| `parent_id` | UUID | FK → comments.id | Comment trả lời (thread) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày cập nhật |

---

## 📎 9. Attachments

### `attachments`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `card_id` | UUID | FK → cards.id ON DELETE CASCADE | Thuộc card |
| `uploaded_by` | UUID | FK → users.id | Người upload |
| `file_name` | VARCHAR(255) | NOT NULL | Tên file gốc |
| `file_url` | TEXT | NOT NULL | URL lưu trữ |
| `file_type` | VARCHAR(100) | NULL | MIME type |
| `file_size` | BIGINT | NULL | Dung lượng (bytes) |
| `is_cover` | BOOLEAN | DEFAULT false | Dùng làm ảnh bìa card |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |

---

## 📊 10. Activity Logs

### `activity_logs`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `user_id` | UUID | FK → users.id | Người thực hiện |
| `entity_type` | VARCHAR(50) | NOT NULL | `card` / `board` / `list` / `organization` |
| `entity_id` | UUID | NOT NULL | ID của đối tượng |
| `action` | VARCHAR(100) | NOT NULL | `created` / `moved` / `archived` / `commented` ... |
| `metadata` | JSONB | NULL | Dữ liệu bổ sung (giá trị cũ, mới...) |
| `board_id` | UUID | FK → boards.id | Thuộc board (denormalized) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm thực hiện |

---

## 🔔 11. Notifications

### `notifications`
| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | ID |
| `user_id` | UUID | FK → users.id ON DELETE CASCADE | Người nhận |
| `type` | VARCHAR(100) | NOT NULL | `card_assigned` / `due_date_reminder` / `mentioned` / `comment_added`... |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề thông báo |
| `message` | TEXT | NULL | Nội dung chi tiết |
| `entity_type` | VARCHAR(50) | NULL | Loại đối tượng liên quan |
| `entity_id` | UUID | NULL | ID đối tượng liên quan |
| `is_read` | BOOLEAN | DEFAULT false | Đã đọc chưa |
| `read_at` | TIMESTAMPTZ | NULL | Thời điểm đọc |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |

---

## 🔗 Entity Relationship Diagram

```
users ──────────────────────────────────────────────────────┐
  │                                                          │
  ├──< organization_members >──── organizations              │
  │                                     │                   │
  ├──< board_members >──── boards ──────┘                   │
  │                          │                              │
  │                          ├──< lists                     │
  │                          │       │                      │
  │                          │       └──< cards ────────────┘
  │                          │               │
  │                          │               ├──< card_members >── users
  │                          │               ├──< card_labels >─── labels
  │                          │               ├──< checklists
  │                          │               │       └──< checklist_items
  │                          │               ├──< comments
  │                          │               └──< attachments
  │                          └──< labels
  │
  ├──< refresh_tokens
  ├──< email_verifications
  ├──< activity_logs
  └──< notifications
```

---

## 📌 Indexes đề xuất

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Organization members
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);

-- Board members
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_board_members_board_id ON board_members(board_id);

-- Lists
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_lists_position ON lists(board_id, position);

-- Cards
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_board_id ON cards(board_id);
CREATE INDEX idx_cards_position ON cards(list_id, position);
CREATE INDEX idx_cards_due_date ON cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_cards_assigned ON card_members(user_id);

-- Activity logs
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_board_id ON activity_logs(board_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
```

---

## 🚀 Kế hoạch triển khai (theo giai đoạn)

### Phase 1 — Core Foundation
- [x] `users`, `refresh_tokens`, `email_verifications`
- [x] `organizations`, `organization_members`
- [x] `boards`, `board_members`

### Phase 2 — Board Features
- [x] `lists`, `cards`, `card_members`
- [x] `labels`, `card_labels`

### Phase 3 — Advanced Card Features
- [ ] `checklists`, `checklist_items`
- [x] `comments` — API (GET/POST/PUT/DELETE) + threaded UI (edit/delete/reply) ✅
- [ ] `attachments`

### Phase 4 — Monitoring & Notifications
- [x] `activity_logs` — API (GET /boards/:id/activity, GET /cards/:id/activity) + Activity tab in CardDetailModal ✅
- [ ] `notifications`

---

## 📁 Cấu trúc thư mục đề xuất

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
│   ├── authenticate.js       ← Verify JWT
│   ├── authorize.js          ← Check role/permission
│   └── validate.js
├── utils/
│   ├── jwt.js
│   ├── bcrypt.js
│   └── response.js
└── app.js
```
