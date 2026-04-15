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

## Tổng kết tiến độ

| Phase | Backend | Frontend |
|---|:---:|:---:|
| Phase 1 — Auth & Workspace | ✅ Done | ✅ Scaffold done (mock data, chưa kết nối API thật) |
| Phase 2 — Boards & Kanban | Chưa bắt đầu | Chưa bắt đầu |
| Phase 3 — Card Detail | Chưa bắt đầu | Chưa bắt đầu |
| Phase 4 — Notifications | Chưa bắt đầu | Chưa bắt đầu |

**Bước tiếp theo:** Backend Phase 2 (Lists, Cards, Labels) và kết nối Frontend với API thật (bỏ mock data, tích hợp React Query).
