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

**How to validate:** Track time-to-first-action after opening the board. Track how often users reorder or move cards within the first session.

---

### H2 — Multi-workspace isolation increases adoption within organizations
**Hypothesis:** Teams adopt the tool more broadly when each team or project can have its own workspace with independent membership — they do not want a monolithic single workspace shared by everyone.

**How to validate:** Measure if organizations create more than one workspace. Measure cross-workspace membership rates.

---

### H3 — Card-level details (checklist, due date, priority, assignee) reduce follow-up messages
**Hypothesis:** When all task context lives on the card itself, team members send fewer "what's the status?" messages because the card surface answers those questions directly.

**How to validate:** Compare comment volume on cards that have complete metadata (assignee + due date + checklist) vs. cards that don't.

---

### H4 — Float-based position ordering enables frictionless drag-and-drop at scale
**Hypothesis:** Storing `position` as a FLOAT allows inserting cards/lists between existing items without rewriting the position values of all sibling items — making drag-and-drop O(1) writes instead of O(n).

**Technical implication:** Card A at position 1.0, Card B at position 2.0 → inserting between them sets position 1.5. Only one write. No batch update.

---

### H5 — Notifications reduce missed deadlines without requiring polling behavior
**Hypothesis:** Push notifications for due-date reminders and card assignments shift users from reactive checking to proactive awareness, reducing overdue tasks.

**How to validate:** Track the rate of cards completed before due date for users with notifications enabled vs. disabled.

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
- `workspace` → all workspace members can view it (read-only unless they are board members)
- `public` → anyone with the link can view it

**Why this matters:** Teams want to share some boards openly (e.g., a roadmap board) while keeping others restricted (e.g., a hiring board).

---

### 4.2 Kanban State Machine

Each card has an implicit state defined by which list it lives in. The lists themselves define the workflow stages — TaskFlow imposes no hardcoded stages. Teams define their own (e.g., `Backlog → In Design → In Dev → QA → Done`).

```
Card state = list it belongs to
Card progress = is_completed flag + checklist completion %
Card urgency  = priority + due_date proximity
```

**Logic for "overdue":** A card is overdue when `due_date < NOW()` AND `is_completed = false`. This is computed at query time — not stored — to avoid stale data.

---

### 4.3 Drag-and-Drop Position Logic

When a user drags card X between cards A and B:

```
new_position = (position_A + position_B) / 2
```

This is stored as a FLOAT. After many reorders the gap between positions can become very small (e.g., 1.0000000001). To prevent floating point precision loss, a **rebalancing job** should periodically re-assign positions with clean integer gaps (1.0, 2.0, 3.0…) when the gap falls below a threshold.

**Why FLOAT over integer:** With integer positions, inserting between positions 3 and 4 requires shifting all items ≥ 4 up by 1. With FLOAT, one write is enough.

---

### 4.4 Activity Log Logic

Every mutation triggers an activity log entry. The log is append-only and stores:
- **who** acted (`user_id`)
- **what** they did (`action` — e.g., `card.moved`, `card.assigned`)
- **on what** (`entity_type` + `entity_id`)
- **context** (`metadata` JSONB — stores old and new values for change events)

**Why denormalize `board_id` on activity_logs:** Fetching the activity timeline for a board would otherwise require joining through cards → lists → boards for every log entry. The redundant `board_id` makes the board-level activity feed query O(1) instead of O(n joins).

---

### 4.5 Notification Trigger Logic

Notifications are generated by server-side events, not by polling. The trigger rules:

| Event | Who gets notified |
|---|---|
| Card assigned to user | The assigned user |
| Comment posted on card | All members assigned to that card |
| User @mentioned in comment | The mentioned user |
| Card due date approaching | All assignees of that card (N minutes before, configurable via `due_reminder`) |

**Read state logic:** Each notification has an `is_read` flag per user. "Mark all as read" sets `is_read = true` for all records where `user_id = current_user AND is_read = false`. This is a bulk update — efficient with the `(user_id, is_read)` composite index.

---

### 4.6 Authentication Token Logic

```
Login → issue Access Token (short-lived, 15min) + Refresh Token (long-lived, stored in DB)
API call → send Access Token in Authorization header
Access Token expires → call /refresh with Refresh Token → get new Access Token
Logout (one device) → revoke that device's Refresh Token (is_revoked = true)
Logout (all devices) → revoke all Refresh Tokens for that user_id
```

**Why store Refresh Token in DB:** Stateless JWTs cannot be invalidated before expiry. Storing the token in `refresh_tokens` with an `is_revoked` flag gives us the ability to force-logout compromised sessions.

---

## 5. Key User Flows

### Flow 1 — New team onboarding
1. Owner registers and creates a workspace
2. Owner invites teammates via email → they receive invite → join workspace
3. Owner creates a board → adds members → creates lists → creates first cards

### Flow 2 — Daily work cycle
1. Contributor opens board → sees their assigned cards (filtered by assignee)
2. Picks the highest priority card → opens modal → reads description and checklist
3. Moves card to "In Progress" → works → ticks off checklist items
4. Moves card to "Done" when complete → marks `is_completed = true`

### Flow 3 — Reviewing progress (Team Lead)
1. Opens board → scans lists for cards stuck in "In Progress" too long
2. Checks overdue cards (due_date past + not completed)
3. Opens activity log to see recent changes
4. Comments on blocked card to unblock it → assignee gets notified

---

## 6. Scope Boundaries (What This Product Is NOT)

| Out of scope | Reason |
|---|---|
| Real-time collaboration (live cursors, instant sync) | Requires WebSocket infrastructure — deferred to a later phase |
| Time tracking | Out of core Kanban workflow scope |
| Gantt chart / timeline view | Different mental model — cards need fixed start dates, not just due dates |
| AI task suggestions | Requires training data from usage — post-MVP |
| File storage (S3 / GCS) | Attachment URLs stored, but actual file hosting is external — simplifies MVP |

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
| Permission model | Two-layer (workspace + board) | Single layer | Teams need board-level control independent of workspace membership |
| Activity log | Append-only JSONB metadata | Event sourcing / separate audit DB | Simpler, sufficient for current scale |
| Notification delivery | In-app only (Phase 1) | Email + in-app | Reduces email infrastructure complexity at MVP stage |
| Board visibility | private / workspace / public | Binary private/public only | Common request: "share roadmap but keep team board private" |
