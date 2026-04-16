# TaskFlow — Frontend Description

> **Stack:** React 18 | JavaScript (JSX) | Tailwind CSS | Redux Toolkit | @dnd-kit | Axios

---

## Tổng quan

Frontend của **TaskFlow** là SPA (Single Page Application) theo phong cách Kanban board. Giao tiếp với Backend qua REST API (`http://localhost:3000/api/v1`), hỗ trợ kéo thả, JWT auto-refresh, và quản lý state bằng Redux Toolkit.

**Không dùng:** TypeScript, React Query, Zustand, React Hook Form, shadcn/ui — toàn bộ dùng plain JavaScript + Redux + useState + Tailwind custom components.

---

## Kiến trúc thư mục (thực tế)

```
Frontend/src/
├── api/
│   └── axiosInstance.js      ← Axios + JWT interceptor + token refresh queue
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx     ← Navbar + Sidebar wrapper
│   │   ├── AuthLayout.jsx    ← Layout trang auth (centered card)
│   │   ├── Navbar.jsx        ← Top bar (logo, user menu, notifications)
│   │   └── Sidebar.jsx       ← Left sidebar (workspace list, navigation)
│   ├── board/
│   │   ├── ListColumn.jsx    ← Cột Kanban (sortable + droppable)
│   │   ├── CardItem.jsx      ← Card rút gọn (draggable)
│   │   ├── CardDetailModal.jsx ← Modal chi tiết card
│   │   └── InviteMemberModal.jsx ← Modal mời member vào board
│   └── ui/
│       ├── Avatar.jsx        ← Avatar với fallback initials
│       ├── AvatarStack.jsx   ← Group avatar (+N overflow)
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── ColorPicker.jsx
│       ├── Dropdown.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       ├── NotificationDropdown.jsx
│       ├── ProgressBar.jsx
│       ├── Spinner.jsx
│       └── Tooltip.jsx
├── context/
│   └── AuthContext.jsx       ← (legacy, chưa dùng chính — auth qua Redux)
├── data/
│   ├── constants.js          ← PRIORITY_COLOR, ROLE constants
│   └── mockData.js           ← (giữ lại nhưng không dùng)
├── hooks/
│   ├── useAuth.js
│   ├── useBoard.js
│   ├── useClickOutside.js
│   ├── useDebounce.js
│   └── usePermission.js
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── VerifyEmailPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── workspaces/
│   │   ├── WorkspacesPage.jsx       ← /home
│   │   ├── CreateWorkspacePage.jsx  ← /workspaces/new
│   │   ├── BoardListPage.jsx        ← /workspaces/:slug
│   │   └── WorkspaceSettingsPage.jsx ← /workspaces/:slug/settings
│   ├── boards/
│   │   ├── BoardPage.jsx            ← /board/:boardId (Kanban canvas)
│   │   └── CreateBoardModal.jsx     ← modal tạo board mới
│   └── profile/
│       └── ProfilePage.jsx          ← /profile
├── redux/
│   ├── store.js
│   └── slices/
│       ├── authSlice.js
│       ├── workspaceSlice.js
│       ├── boardSlice.js
│       └── notificationSlice.js
├── services/
│   ├── auth.service.js
│   ├── workspace.service.js
│   ├── board.service.js
│   ├── list.service.js
│   ├── card.service.js
│   ├── label.service.js
│   └── notification.service.js
├── utils/
│   └── helpers.js            ← formatDate, formatRelativeTime, isOverdue, getInitials, generateAvatarColor
├── App.jsx
└── main.jsx
```

---

## State Management (thực tế)

Dùng **Redux Toolkit** cho tất cả — không dùng React Query hay Zustand.

```
Redux Store
│
├── authSlice
│   ├── user                  ← profile object { id, email, full_name, avatar_url }
│   ├── token                 ← JWT access token (localStorage + Redux)
│   ├── refreshToken          ← (localStorage)
│   └── isAuthenticated
│
├── workspaceSlice
│   └── workspaces []         ← danh sách org của user
│       Thunks: fetchWorkspaces, createWorkspaceThunk,
│               updateWorkspaceThunk, deleteWorkspaceThunk
│
├── boardSlice
│   ├── currentBoard          ← board đang mở
│   ├── lists []              ← danh sách lists (ordered by position)
│   ├── cards {}              ← { [listId]: Card[] }
│   ├── boardLabels []        ← labels của board hiện tại
│   ├── cardComments []       ← comments của card đang mở (threaded: top-level có replies[])
│   ├── cardActivity []       ← activity logs của card đang mở
│   ├── loadingBoard
│   ├── loadingLists
│   ├── loadingComments
│   └── loadingActivity
│       Thunks: fetchBoard, fetchBoardLists,
│               createListThunk, createCardThunk,
│               saveCardThunk, deleteCardThunk,
│               fetchBoardLabels, createLabelThunk,
│               updateLabelThunk, deleteLabelThunk,
│               addCardLabelThunk, removeCardLabelThunk,
│               fetchCardComments, addCommentThunk,
│               editCommentThunk, deleteCommentThunk,
│               fetchCardActivity
│
└── notificationSlice
    └── notifications []      ← (placeholder, chưa connect API)
```

### Chiến lược state:

| Loại state | Giải pháp hiện tại |
|---|---|
| Server data (API) | Redux Toolkit async thunks |
| Global UI (auth, workspace, board) | Redux Toolkit slices |
| Form state | `useState` trong từng component |
| Local UI state (dropdown, modal open) | `useState` trong từng component |

---

## API Layer

```
axiosInstance.js
  ├── baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  ├── Request interceptor  → thêm Authorization: Bearer <token> từ localStorage
  └── Response interceptor → khi nhận 401:
        ├── isRefreshing flag chống gọi refresh nhiều lần
        ├── failedQueue: queue các request đang chờ
        ├── Gọi POST /auth/refresh với refreshToken
        ├── Cập nhật token mới vào localStorage + headers
        ├── Retry toàn bộ request trong queue
        └── Nếu refresh thất bại → xóa localStorage → redirect /login

services/ (mỗi file là một domain):
  auth.service.js        → login, register, verifyEmail, forgotPassword,
                           resetPassword, refreshToken, getMe, logout
  workspace.service.js   → getWorkspaces, createWorkspace, updateWorkspace,
                           deleteWorkspace, getWorkspaceMembers, inviteMember,
                           updateMemberRole, removeMember
  board.service.js       → getBoards, getBoard, createBoard, updateBoard,
                           deleteBoard, getBoardMembers, inviteBoardMember
  list.service.js        → getLists, createList, updateList, deleteList
  card.service.js        → getCards, getCard, createCard, updateCard, deleteCard,
                           getComments, addComment, updateComment, deleteComment
  label.service.js       → getBoardLabels, createLabel, updateLabel, deleteLabel,
                           getCardLabels, addCardLabel, removeCardLabel
  activityLog.service.js → getCardActivity, getBoardActivity
  notification.service.js → (placeholder)
```

---

## Routing (thực tế)

```
App.jsx
│
├── PublicRoute (redirect /home nếu đã đăng nhập)
│   ├── /login              → LoginPage
│   ├── /register           → RegisterPage
│   ├── /verify-email       → VerifyEmailPage
│   ├── /forgot-password    → ForgotPasswordPage
│   └── /reset-password     → ResetPasswordPage
│
├── /                       → <Navigate to="/home" />
│
├── ProtectedRoute (redirect /login nếu chưa đăng nhập)
│   ├── /home               → WorkspacesPage
│   ├── /workspaces/new     → CreateWorkspacePage
│   ├── /workspaces/:slug   → BoardListPage
│   ├── /workspaces/:slug/settings → WorkspaceSettingsPage
│   ├── /board/:boardId     → BoardPage
│   └── /profile            → ProfilePage
│
└── *                       → <Navigate to="/home" />
```

---

## Màn hình & Trạng thái

### 1. Auth Pages ✅ Hoàn thành

| Trang | Route | Trạng thái | Ghi chú |
|---|---|:---:|---|
| Đăng nhập | `/login` | ✅ | Lưu accessToken + refreshToken + user vào localStorage + Redux |
| Đăng ký | `/register` | ✅ | Gửi `fullName` (camelCase theo yêu cầu backend), redirect sang verify |
| Xác minh email | `/verify-email` | ✅ | Nhận email từ `location.state`, gọi `POST /auth/verify-email` |
| Quên mật khẩu | `/forgot-password` | ✅ | Gửi email reset |
| Đặt lại mật khẩu | `/reset-password` | ✅ | Đọc token từ `useSearchParams` |

---

### 2. Workspace Pages ✅ Hoàn thành

| Trang | Route | Trạng thái |
|---|---|:---:|
| Danh sách workspace | `/home` | ✅ |
| Tạo workspace | `/workspaces/new` | ✅ |
| Danh sách board | `/workspaces/:slug` | ✅ |
| Cài đặt workspace | `/workspaces/:slug/settings` | ✅ |

**Chi tiết WorkspaceSettingsPage:**
- Tab **Chung:** cập nhật tên, mô tả → `PUT /organizations/:id`
- Tab **Thành viên:** bảng members, inline invite form (email + role picker), đổi role, xoá member
- Vùng nguy hiểm: xoá workspace → `DELETE /organizations/:id` → navigate `/home`

**Lưu ý routing:** URL dùng `slug` (vd: `my-team`), nhưng API dùng UUID. Giải pháp: lưu full object vào Redux → tìm workspace bằng `workspaces.find(w => w.slug === slug)` → dùng `workspace.id` cho API calls.

---

### 3. Board Pages ✅ Hoàn thành

| Trang | Route | Trạng thái |
|---|---|:---:|
| Danh sách board | `/workspaces/:slug` | ✅ (trong BoardListPage) |
| Kanban board | `/board/:boardId` | ✅ |

**BoardPage — Luồng tải:**
```
mount → dispatch(clearBoard())
      → dispatch(fetchBoard(boardId))       [song song]
      → dispatch(fetchBoardLists(boardId))  [song song]
      → getBoardMembers(boardId)            [song song]
```

**BoardPage — DnD với @dnd-kit:**
- `DndContext` bọc toàn bộ board canvas
- `SortableContext` + `horizontalListSortingStrategy` cho list reorder
- `SortableContext` + `verticalListSortingStrategy` cho card reorder trong mỗi list
- `DragOverlay` hiển thị ghost card khi đang kéo (rotate 3deg, scale 1.05)
- `onDragOver`: xử lý move card giữa 2 list khác nhau (optimistic update Redux)
- `onDragEnd`: xử lý reorder cuối cùng
- ⚠️ **Chưa persist**: vị trí sau khi kéo chưa được ghi vào DB

---

### 4. Card Detail Modal ✅ Core, ⏳ Một phần

Mở overlay modal khi click vào `CardItem`, không navigate sang trang mới.

**Sections đã implement:**

| Section | Trạng thái | Ghi chú |
|---|:---:|---|
| Cover (màu bìa) | ✅ | Hiển thị nếu `card.cover_color` có giá trị |
| Title | ✅ | Edit inline, `onBlur` dispatch `updateCard` vào Redux |
| Description | ✅ | Textarea, `border-red-500` khi `descError`, click ngoài để edit |
| Single Assignee | ✅ | Dropdown chọn 1 member từ boardMembers, `UserX` để bỏ assign |
| Labels | ✅ | Picker đầy đủ: tạo nhãn (tên + 10 màu), toggle assign/unassign, edit tên/màu inline, xoá nhãn khỏi board |
| Due Date | ✅ | `<input type="date">`, đỏ khi `isOverdue()` |
| Priority | ✅ | 4 options (Low/Medium/High/Critical), highlight lựa chọn hiện tại |
| Checklists | ⏳ | Hiển thị nếu `card.checklist_progress` có, chưa có API |
| Comments | ✅ | Tab "Bình luận": tạo mới, reply (1 cấp), edit inline (tác giả), xóa, spinner states, "(đã sửa)" |
| Activity Log | ✅ | Tab "Hoạt động": load từ Redux `cardActivity`, mô tả tiếng Việt, avatar, relative time |

**Nút "Lưu trữ card" (save flow):**
```
Click "Lưu trữ card"
  → validate description.trim() !== ''
  → nếu rỗng: setDescError('Mô tả không được để trống') → highlight border đỏ
  → nếu hợp lệ: dispatch(saveCardThunk({ cardId, listId, data }))
      data = { title, description, priority, dueDate, assigneeId }
      → loading spinner trên button
      → success: cập nhật Redux, đóng modal
      → error: hiển thị saveError
```

**Nút "Xóa card":** dispatch `deleteCardThunk` → API `DELETE /cards/:cardId` → xoá khỏi Redux → đóng modal.

**Single Assignee logic:**
```
boardMembers (từ props, fetch từ GET /boards/:boardId/members)
  → Dropdown hiển thị tất cả members
  → Chọn member đang chọn → bỏ assign (toggle off)
  → Chọn member khác → thay thế
  → Click outside → đóng dropdown (useRef + document.addEventListener)
```

---

### 5. Profile Page ✅ Hoàn thành

- Hiển thị thông tin user từ Redux (`user.full_name`, `user.email`, `user.created_at`)
- Cập nhật tên → dispatch `updateCurrentUser` → cập nhật Redux local (chưa có `PUT /auth/me` API)
- Đổi mật khẩu → redirect sang `/forgot-password` flow
- Đăng xuất → `POST /auth/logout` → xóa localStorage → dispatch `logout` → redirect `/login`

---

## Kế hoạch triển khai (cập nhật)

### Phase 1 — Auth & Workspace ✅ Hoàn thành
- [x] Auth pages (5 trang)
- [x] Workspace list, create, settings
- [x] Invite member vào workspace
- [x] Kết nối toàn bộ API thật (bỏ mock data)

### Phase 2 — Board & Kanban 🔄 Đang thực hiện
- [x] Board list, create board modal
- [x] Kanban board layout (lists + cards từ API)
- [x] Drag & drop lists và cards (UI)
- [x] Tạo list, tạo card qua API
- [x] Card detail modal (core: title, desc, priority, due date, assignee)
- [x] Save card xuống DB với validation
- [ ] **Persist DnD position vào DB** (gọi PUT sau `onDragEnd`)
- [x] Labels & label picker (tạo, toggle assign, edit, xoá)

### Phase 3 — Advanced Card Features 🔄 Đang thực hiện
- [x] Comments API + UI (tạo, reply, edit, xóa — kết nối API thật)
- [x] Activity log trên card (tab Hoạt động trong CardDetailModal)
- [ ] Checklists & checklist items
- [ ] Attachments upload

### Phase 4 — Notifications ⏳
- [ ] Notification bell + dropdown (UI placeholder đã có)
- [ ] Connect notification API

---

## Công nghệ sử dụng (thực tế)

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | JavaScript (JSX) — không dùng TypeScript | — |
| Build tool | Vite | 6.0.5 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | Custom Tailwind (không dùng shadcn/Radix) | — |
| Global state | Redux Toolkit | 2.3.0 |
| Server state | Redux Toolkit async thunks (không dùng React Query) | — |
| Forms | `useState` (không dùng React Hook Form) | — |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.x / 8.x |
| HTTP Client | Axios | 1.7.9 |
| Routing | React Router | 7.1.1 |
| Icons | Lucide React | 0.469.0 |
| Date handling | Custom helpers (không dùng date-fns) | — |
