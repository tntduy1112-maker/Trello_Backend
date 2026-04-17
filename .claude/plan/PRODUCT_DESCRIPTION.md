# TaskFlow — Product Description

> Focus: Product Hypotheses, Core Logic, and Decision Rationale

---

## 1. Problem Statement

Teams lose time and context because tasks live in disconnected places — chat threads, spreadsheets, verbal agreements. The core pain points:

- **No shared visibility:** team members don't know what others are working on or what's blocked.
- **No accountability:** tasks get forgotten because there is no clear owner or deadline.
- **No workflow:** work moves forward informally with no defined stages (To Do → In Progress → Done).

**Root hypothesis:** If teams visualize their work on a shared Kanban board, task completion rates increase and status-check meetings decrease.

---

## 2. Target Users

| Persona | Context | Core Need |
|---|---|---|
| Team Lead / Project Manager | Oversees 3–10 people across multiple workstreams | See all work at a glance without asking individuals |
| Individual Contributor | Assigned to multiple tasks across projects | Know what to work on next and by when |
| Stakeholder / Client | Needs to follow progress without modifying | Read-only access to specific boards |

**User type implication:** This drives the 4-role permission model (owner / admin / member / viewer) — not all users need write access.

---

## 3. Product Hypotheses

These are the core bets behind the product decisions.

### H1 — Kanban reduces cognitive load
**Hypothesis:** Visualizing work as cards in columns (To Do / In Progress / Done) is more intuitive than a flat task list, reducing the time users spend deciding what to work on next.

**Current state:** Board canvas with DnD lists and cards is working end-to-end. Cards persist to DB.

---

### H2 — Multi-workspace isolation increases adoption within organizations
**Hypothesis:** Teams adopt the tool more broadly when each team or project can have its own workspace with independent membership — they do not want a monolithic single workspace shared by everyone.

**Current state:** Workspace (Organization) CRUD fully implemented. Members can be invited by email and given roles.

---

### H3 — Card-level details (checklist, due date, priority, assignee) reduce follow-up messages
**Hypothesis:** When all task context lives on the card itself, team members send fewer "what's the status?" messages because the card surface answers those questions directly.

**Current state:** Title, description, priority, due date, single assignee, labels, and comments are implemented and persist to DB. Checklists are not yet implemented.

**Design decision — single assignee:** Each card has exactly **one assignee** at a time (not multi-assign). This makes ownership unambiguous — someone is responsible or no one is. Multi-assign was considered but rejected as it dilutes accountability ("everyone's responsible = no one is").

---

### H4 — Float-based position ordering enables frictionless drag-and-drop at scale
**Hypothesis:** Storing `position` as a FLOAT allows inserting cards/lists between existing items without rewriting the position values of all sibling items — making drag-and-drop O(1) writes instead of O(n).

**Technical implication:** Card A at position 1.0, Card B at position 2.0 → inserting between them sets position 1.5. Only one write. No batch update.

**Current state:** Position is stored as FLOAT in both `lists` and `cards` tables. DnD reordering works in the UI (via @dnd-kit) but the new position is **not yet persisted to DB** — page refresh resets order. Persisting DnD is the next step.

---

### H5 — Notifications reduce missed deadlines without requiring polling behavior
**Hypothesis:** Push notifications for due-date reminders and card assignments shift users from reactive checking to proactive awareness, reducing overdue tasks.

**Current state:** ✅ Fully implemented via SSE (Server-Sent Events). Three trigger types: card assigned, comment added, due date reminder (cron hourly with 24h dedup guard). Bell icon unread badge + dropdown (mark read, mark all, delete). Real-time push without polling.

---

## 4. Core Product Logic

### 4.1 Permission Logic

Two independent permission layers stack on top of each other:

```
Workspace role (owner / admin / member)
    ↓ gates access to boards within that workspace
Board role (owner / admin / member / viewer)
    ↓ gates what actions are allowed on that board
```

**Key logic rule:** A user must be a member of the workspace AND the board to interact with that board. Workspace membership alone does not grant board access (unless board visibility is `workspace` or `public`).

**Visibility overrides:**
- `private` → only board members can see it
- `workspace` → all workspace members can view it
- `public` → anyone with the link can view it

**Current state:** Fully implemented and enforced in service layer for all resources (boards, lists, cards). Every API endpoint checks `board_members` before allowing mutations.

---

### 4.2 Kanban State Machine

Each card has an implicit state defined by which list it lives in. The lists themselves define the workflow stages — TaskFlow imposes no hardcoded stages. Teams define their own (e.g., `Backlog → In Design → In Dev → QA → Done`).

```
Card state    = list it belongs to       ✅ implemented
Card progress = is_completed flag         ✅ field exists, UI checkbox pending
              + checklist completion %    ⏳ not yet implemented
Card urgency  = priority (low/med/high/critical) + due_date proximity  ✅ implemented
Card owner    = single assignee (card_members, max 1)                  ✅ implemented
```

**Logic for "overdue":** A card is overdue when `due_date < NOW()` AND `is_completed = false`. Computed at display time on the frontend (`isOverdue()` helper) — not stored — to avoid stale data.

---

### 4.3 Drag-and-Drop Position Logic

When a user drags card X between cards A and B:

```
new_position = (position_A + position_B) / 2
```

This is stored as a FLOAT. After many reorders the gap between positions can become very small (e.g., 1.0000000001). To prevent floating point precision loss, a **rebalancing job** should periodically re-assign positions with clean integer gaps (1.0, 2.0, 3.0…) when the gap falls below a threshold.

**Why FLOAT over integer:** With integer positions, inserting between positions 3 and 4 requires shifting all items ≥ 4 up by 1. With FLOAT, one write is enough.

**Current state (partial):** DnD works visually using @dnd-kit (card reorder within list, card move between lists, list reorder). Redux state updates optimistically. However, the new position is **not yet written back to the DB** — reloading the page will reset the order to the original DB order. Next step: call `PUT /cards/:cardId` and `PUT /lists/:listId` with the computed new position on `onDragEnd`.

---

### 4.4 Card Save Flow

The card detail modal follows a deliberate two-phase save model:

```
Phase 1 — Optimistic local updates (instant feedback):
  - Edit title inline → dispatches updateCard to Redux immediately
  - Change priority → dispatches updateCard to Redux immediately
  - Change due date → dispatches updateCard to Redux immediately
  - Select assignee → dispatches updateCard to Redux immediately

Phase 2 — Explicit DB save ("Lưu trữ card" button):
  - Validates: description must not be empty
  - Calls PUT /cards/:cardId with { title, description, priority, dueDate, assigneeId }
  - On success: updates Redux with server response, closes modal
```

**Design rationale:** The explicit save button gives users control over when their changes are committed, avoiding accidental half-edits being saved. Description is required at save time to ensure cards always have meaningful content before being persisted.

---

### 4.5 Activity Log Logic

Every mutation triggers an activity log entry. The log is append-only and stores:
- **who** acted (`user_id`)
- **what** they did (`action` — e.g., `card.moved`, `card.assigned`)
- **on what** (`entity_type` + `entity_id`)
- **context** (`metadata` JSONB — stores old and new values for change events)

**Why denormalize `board_id` on activity_logs:** Fetching the activity timeline for a board would otherwise require joining through cards → lists → boards for every log entry. The redundant `board_id` makes the board-level activity feed query O(1) instead of O(n joins).

**Current state:** ✅ Fully implemented. `activityLogger.js` utility hooked into `cards.service` (card.created/updated/deleted), `lists.service` (list.created/deleted), and `comments.service` (comment.added). Two read endpoints: `GET /boards/:boardId/activity` and `GET /cards/:cardId/activity`. CardDetailModal shows an **Activity tab** alongside the Comments tab.

---

### 4.6 Notification Trigger Logic

Notifications are generated by server-side events, not by polling. The trigger rules:

| Event | Who gets notified |
|---|---|
| Card assigned to user | The assigned user |
| Comment posted on card | Assignee of the card (if not the commenter); parent comment author on reply |
| Card due date approaching | Card assignee — 24h before deadline |

**Read state logic:** Each notification has an `is_read` flag per user. "Mark all as read" sets `is_read = true` for all records where `user_id = current_user AND is_read = false`.

**Delivery:** SSE (Server-Sent Events) on a single persistent channel per authenticated user (`GET /notifications/stream?token=`). `sendNotification()` is fire-and-forget — failure never breaks the main request.

**Current state:** ✅ Fully implemented. Backend: `notificationSender.js` + `sseClients.js` + `notifications` module (6 endpoints) + `dueDateReminder` cron job. Frontend: `useNotificationStream` hook + `notificationSlice` + `NotificationDropdown` UI.

### 4.7 Reactive Activity Stream Logic

When a card's activity changes (any mutation by any board member), the Card Detail modal of any user currently viewing that card should update live — without a page refresh.

**Transport:** Reuses the existing single SSE channel per user. Events with `topic: 'card_activity'` are routed to `injectCardActivity` reducer; all other events go to `addNotification`.

**Fan-out:** On every `logActivity()` call, the backend queries `board_members` and pushes the enriched activity row to each connected member via the existing `pushSSE`.

**De-duplication:** Each incoming event carries a unique `id` (DB primary key). The `injectCardActivity` reducer discards events whose `id` is already in `cardActivity[]`.

**Scope guard:** `openCardId` in Redux state tracks which card modal is open. `injectCardActivity` silently no-ops if `event.entity_id !== openCardId`.

**Current state:** ✅ Phase 1 (Foundation) complete. ⏳ Phase 2 (scroll-aware UX, highlight animation, tab badge) and Phase 3 (Type B batching, reconnect recovery) pending.

---

### 4.7 Authentication Token Logic

```
Login → issue Access Token (short-lived, 15min) + Refresh Token (long-lived, stored in DB)
API call → send Access Token in Authorization header
Access Token expires → Axios interceptor auto-calls /refresh → gets new Access Token
               └── other in-flight requests are queued until refresh completes
Logout (one device) → revoke that device's Refresh Token (is_revoked = true)
Logout (all devices) → revoke all Refresh Tokens for that user_id
```

**Why store Refresh Token in DB:** Stateless JWTs cannot be invalidated before expiry. Storing the token in `refresh_tokens` with an `is_revoked` flag gives us the ability to force-logout compromised sessions.

**Current state:** Fully implemented. Token refresh with request queue is wired in `axiosInstance.js` — multiple simultaneous 401s trigger only one refresh call; other requests wait and retry automatically.

---

## 5. Key User Flows

### Flow 1 — New team onboarding ✅ Working end-to-end
1. Owner registers → verifies email via OTP
2. Owner creates a workspace → invites teammates via email → they join
3. Owner creates a board → invites board members → creates lists → creates first cards

### Flow 2 — Daily work cycle ✅ Core working, checklist pending
1. Contributor opens board → sees all cards per list
2. Clicks a card → opens detail modal → reads description
3. Updates priority, due date, assignee in the sidebar
4. Fills in description → clicks "Lưu trữ card" → saved to DB
5. Comments on card, replies to teammates, edits/deletes own comments ✅
6. ~~Ticks off checklist items~~ (not yet implemented)
7. ~~Moves card to Done via drag-and-drop~~ (DnD works visually, not persisted yet)

### Flow 3 — Reviewing progress (Team Lead) ✅ Core working
1. Opens board → scans lists ✅
2. Checks overdue cards (highlighted in red on due date) ✅
3. Opens card → switches to **Hoạt động** tab → sees full change history ✅
4. Comments on blocked card → teammates see comment in modal ✅

---

## 6. Scope Boundaries (What This Product Is NOT)

| Out of scope | Reason |
|---|---|
| Live cursors / concurrent editing indicators | Requires presence registry beyond current scope |
| Time tracking | Out of core Kanban workflow scope |
| Gantt chart / timeline view | Different mental model — cards need fixed start dates, not just due dates |
| AI task suggestions | Requires training data from usage — post-MVP |
| Multi-instance real-time (Redis pub/sub) | Single-instance SSE is sufficient until horizontal scaling is needed |

---

## 7. Success Metrics

| Metric | Target | Hypothesis it validates |
|---|---|---|
| Cards moved per board per day | > 3 | H1 — board is actively used as a workflow tool |
| Workspaces per organization | > 2 | H2 — multi-workspace isolation drives adoption |
| Cards completed before due date | > 60% | H5 — notifications reduce missed deadlines |
| Comments per card (cards with full metadata vs. without) | Lower for cards with assignee + due date | H3 — card context reduces follow-up messages |

---

## 8. Key Design Decisions & Trade-offs

| Decision | Chosen approach | Alternative considered | Reason |
|---|---|---|---|
| Position ordering | FLOAT | Integer with reorder | O(1) insert without batch updates |
| Auth token storage | DB-backed Refresh Token | Stateless JWT only | Need ability to revoke sessions |
| Token refresh race condition | `isRefreshing` flag + request queue | Retry each request independently | Avoid calling `/refresh` N times simultaneously |
| Permission model | Two-layer (workspace + board) | Single layer | Teams need board-level control independent of workspace membership |
| Activity log | Append-only JSONB metadata | Event sourcing / separate audit DB | Simpler, sufficient for current scale |
| Notification delivery | In-app only (Phase 1) | Email + in-app | Reduces email infrastructure complexity at MVP stage |
| Board visibility | private / workspace / public | Binary private/public only | Common request: "share roadmap but keep team board private" |
| Card assignee | Single assignee only | Multi-assign | Unambiguous ownership — one person is responsible |
| Card save trigger | Explicit "Lưu trữ card" button | Auto-save on every field change | Prevent accidental partial saves; description required before commit |

---

## 9. Implementation Status

| Feature | Backend | Frontend |
|---|:---:|:---:|
| Auth (register, login, OTP, reset) | ✅ | ✅ |
| Workspace CRUD + member management | ✅ | ✅ |
| Board CRUD + member management | ✅ | ✅ |
| Board invitation (token-based, 2 flows) | ✅ | ✅ |
| Lists CRUD | ✅ | ✅ |
| Cards CRUD (title, desc, priority, due date, assignee) | ✅ | ✅ |
| Card completion toggle (`is_completed`) | ✅ | ✅ |
| Drag & Drop (UI visual reorder) | — | ✅ |
| Drag & Drop (persist position to DB) | ✅ ready | ⏳ not wired |
| Labels | ✅ | ✅ |
| Comments (threaded, edit, delete, reply) | ✅ | ✅ |
| Activity Logs (card + board feed) | ✅ | ✅ |
| Attachments (MinIO, cover image) | ✅ | ✅ |
| Security hardening (hashed tokens, Redis blacklist, rotation) | ✅ | ✅ |
| Notifications SSE (assign, comment, due date) | ✅ | ✅ |
| Reactive Activity Stream — Phase 1 | ✅ | ✅ |
| Reactive Activity Stream — Phase 2 UX | ⏳ | ⏳ |
| Checklists | ⏳ | ⏳ |
