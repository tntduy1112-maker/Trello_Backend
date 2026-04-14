# TaskFlow API

> Trello-style task management REST API built with Node.js, Express, and PostgreSQL 16.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL 16 |
| Auth | JWT (Access + Refresh Token) |
| Password | bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| Docs | Swagger UI (dev only) |
| Container | Docker / Docker Compose |

---

## Project Structure

```
├── migrations/
│   └── 001_init.sql          # All table definitions & indexes
├── src/
│   ├── app.js                # Entry point
│   ├── configs/
│   │   ├── env.js            # Environment loader
│   │   ├── postgres.js       # PostgreSQL pool
│   │   └── swagger.js        # Swagger spec
│   ├── middlewares/
│   │   ├── authenticate.js   # JWT guard
│   │   └── validate.js       # Joi request validation
│   ├── modules/
│   │   ├── auth/             # Register, login, email verify, password reset
│   │   ├── organizations/    # Workspace CRUD + member management
│   │   └── boards/           # Board CRUD + member management
│   └── utils/
│       ├── jwt.js
│       ├── bcrypt.js
│       ├── email.js
│       └── response.js
├── .env.development
├── .env.production
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/tntduy1112-maker/Trello_Backend.git
cd Trello_Backend
```

### 2. Configure environment

```bash
cp .env.example .env.development
```

Edit `.env.development` with your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=postgres

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=TaskFlow <your@gmail.com>

SWAGGER_ENABLED=true
```

> **Gmail App Password:** Go to [myaccount.google.com/security](https://myaccount.google.com/security) → Enable 2FA → App passwords → Generate.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
docker exec -i postgres16 psql -U postgres -d mydb < migrations/001_init.sql
```

### 5. Install dependencies & start

```bash
npm install
npm run dev       # development
npm start         # production
```

---

## Environment Modes

| Command | Mode | Swagger | Config file |
|---|---|---|---|
| `npm run dev` | development | Enabled | `.env.development` |
| `npm start` | production | Disabled | `.env.production` |

---

## API Documentation

Swagger UI is available in development mode at:

```
http://localhost:3000/api-docs
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new account |
| POST | `/auth/login` | — | Login, returns JWT tokens |
| POST | `/auth/refresh` | — | Get new access token |
| POST | `/auth/logout` | — | Revoke refresh token |
| GET | `/auth/me` | Bearer | Get current user profile |
| POST | `/auth/verify-email` | — | Verify email with OTP |
| POST | `/auth/resend-verification` | — | Resend OTP to email |
| POST | `/auth/forgot-password` | — | Send password reset email |
| POST | `/auth/reset-password` | — | Reset password with token |

### Organizations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/organizations` | Bearer | List user's organizations |
| POST | `/organizations` | Bearer | Create organization |
| GET | `/organizations/:id` | Bearer | Get organization detail |
| PUT | `/organizations/:id` | Bearer | Update organization (owner/admin) |
| DELETE | `/organizations/:id` | Bearer | Delete organization (owner) |
| GET | `/organizations/:id/members` | Bearer | List members |
| POST | `/organizations/:id/members` | Bearer | Invite member |
| PUT | `/organizations/:id/members/:userId` | Bearer | Update member role |
| DELETE | `/organizations/:id/members/:userId` | Bearer | Remove member |

### Boards

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/organizations/:id/boards` | Bearer | List boards in organization |
| POST | `/organizations/:id/boards` | Bearer | Create board |
| GET | `/boards/:id` | Bearer | Get board detail |
| PUT | `/boards/:id` | Bearer | Update board (owner/admin) |
| DELETE | `/boards/:id` | Bearer | Delete board (owner) |
| GET | `/boards/:id/members` | Bearer | List board members |
| POST | `/boards/:id/members` | Bearer | Invite member to board |
| PUT | `/boards/:id/members/:userId` | Bearer | Update member role |
| DELETE | `/boards/:id/members/:userId` | Bearer | Remove member from board |

---

## Role Permissions

### Organization

| Action | owner | admin | member |
|---|:---:|:---:|:---:|
| Delete workspace | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ |
| Create board | ✅ | ✅ | ✅ |
| View boards | ✅ | ✅ | ✅ |

### Board

| Action | owner | admin | member | viewer |
|---|:---:|:---:|:---:|:---:|
| Delete board | ✅ | ❌ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ | ❌ |
| Create / delete list | ✅ | ✅ | ✅ | ❌ |
| Create / edit card | ✅ | ✅ | ✅ | ❌ |
| View board | ✅ | ✅ | ✅ | ✅ |

---

## Database Schema

19 tables across 4 phases:

```
users
  ├── refresh_tokens
  ├── email_verifications
  └── organizations
        ├── organization_members
        └── boards
              ├── board_members
              └── lists
                    └── cards
                          ├── card_members
                          ├── card_labels ── labels
                          ├── checklists
                          │     └── checklist_items
                          ├── comments
                          └── attachments
```

---

## Roadmap

- [x] Phase 1 — Auth, Organizations, Boards
- [ ] Phase 2 — Lists, Cards, Labels
- [ ] Phase 3 — Checklists, Comments, Attachments
- [ ] Phase 4 — Activity Logs, Notifications
