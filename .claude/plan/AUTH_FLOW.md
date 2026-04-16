# Authentication Flow — TaskFlow

> Tài liệu mô tả toàn bộ luồng xác thực trong hệ thống, dựa trên code thực tế tại `Backend/src/modules/auth/`.

---

## Tổng quan các thành phần

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client    │     │  authenticate.js │     │  auth.service   │     │  PostgreSQL  │
│  (Frontend) │     │  (Middleware)    │     │  + auth.model   │     │  (Database)  │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
                                                      │                      │
                                             ┌────────┴────────┐    ┌────────┴────────┐
                                             │   utils/        │    │     Redis        │
                                             │  ├── jwt.js     │    │  blacklist:<jti> │
                                             │  ├── bcrypt.js  │    │  TTL = AT expiry │
                                             │  ├── email.js   │    │  O(1) EXISTS     │
                                             │  └── tokenCrypto│    └─────────────────┘
                                             └─────────────────┘

Tokens:
  accessToken   → JWT, secret: JWT_ACCESS_SECRET,  TTL: 15 phút
                  Payload: { userId, email, jti (UUID), iat, exp }
                  Blacklist: jti lưu vào Redis (key: blacklist:<jti>) khi logout/revoke
  refreshToken  → JWT, secret: JWT_REFRESH_SECRET, TTL: 7 ngày
                  Payload: { userId, email, jti (UUID), iat, exp }
                  Cookie: AES-256-GCM encrypted (không phải raw JWT)
                  httpOnly; SameSite=Lax; Secure (prod); MaxAge=7d
                  DB: SHA-256 hash của raw token (không lưu raw)
                  Rotation: mỗi lần /refresh → RT cũ bị revoke, RT mới được cấp

Lớp bảo vệ (defense in depth):
  ── Refresh Token ──
  1. httpOnly cookie         → JS không đọc được (chống XSS)
  2. SameSite=Lax            → chống CSRF
  3. Secure (prod)           → chỉ gửi qua HTTPS
  4. AES-256-GCM encrypt     → cookie bị đánh cắp vẫn vô dụng
  5. SHA-256 hash trong DB   → DB bị dump vẫn không dùng được token
  6. Rotation + Reuse detect → RT bị dùng lại → nuke toàn bộ session user
  ── Access Token ──
  7. jti blacklist           → logout/revoke tức thì, không chờ hết hạn
  8. tokens_valid_after      → mass revocation (reuse/reset password/disable)
```

---

## 1. Đăng ký (Register)

**Endpoint:** `POST /api/v1/auth/register`

```
Client                        Middleware              Service                  DB / Email
  │                               │                      │                        │
  │── POST /register ────────────▶│                      │                        │
  │   {email, password, fullName} │                      │                        │
  │                               │                      │                        │
  │                          validate.js                 │                        │
  │                     (Joi: email, min pw 6,           │                        │
  │                           fullName 1-255)            │                        │
  │                               │                      │                        │
  │                               │── gọi controller ───▶│                        │
  │                               │                      │                        │
  │                               │              findUserByEmail(email)           │
  │                               │                      │──────────────────────▶│
  │                               │                      │◀── null (chưa tồn tại)│
  │                               │                      │                        │
  │                               │              hashPassword(password)           │
  │                               │              [bcrypt, 10 rounds]              │
  │                               │                      │                        │
  │                               │              createUser(email, hash, name)    │
  │                               │                      │──────────────────────▶│
  │                               │                      │◀── user {id, email, …} │
  │                               │                      │                        │
  │                               │              generateOTP() → 6 chữ số         │
  │                               │              expiresAt = now + 15 phút        │
  │                               │              createEmailVerification(         │
  │                               │                userId, otp, 'verify_email')   │
  │                               │                      │──────────────────────▶│
  │                               │                      │                        │
  │                               │              sendVerificationEmail()          │
  │                               │              [non-blocking, fire-and-forget] ──────▶ SMTP
  │                               │                      │                        │
  │◀──── 201 { user } ────────────│                      │                        │
  │  "Check email to verify"      │                      │                        │

Lỗi có thể xảy ra:
  409 Conflict  → Email đã tồn tại
  400 Bad Request → Validation thất bại (Joi)
```

---

## 2. Xác thực Email (Verify Email)

**Endpoint:** `POST /api/v1/auth/verify-email`

```
Client                              Service                              DB
  │                                    │                                  │
  │── POST /verify-email ─────────────▶│                                  │
  │   {email, otp}                     │                                  │
  │                                    │                                  │
  │                           findUserByEmail(email)                      │
  │                                    │─────────────────────────────────▶│
  │                                    │◀──────────── user                │
  │                                    │                                  │
  │                            Kiểm tra: user.is_verified?                │
  │                            → true  → 400 "Already verified"           │
  │                                    │                                  │
  │                           findEmailVerification(otp, 'verify_email')  │
  │                                    │─────────────────────────────────▶│
  │                                    │◀──────────── record              │
  │                                    │                                  │
  │                            Kiểm tra tuần tự:                          │
  │                            1. record tồn tại AND user_id khớp?        │
  │                               → không → 400 "Invalid OTP"             │
  │                            2. record.used_at IS NOT NULL?              │
  │                               → có   → 400 "OTP already used"         │
  │                            3. record.expires_at < now?                 │
  │                               → có   → 400 "OTP expired"              │
  │                                    │                                  │
  │                            markEmailVerificationUsed(record.id)       │
  │                            updateUser(userId, {is_verified: true})    │
  │                                    │─────────────────────────────────▶│
  │                                    │                                  │
  │◀──── 200 "Email verified" ─────────│                                  │
```

---

## 3. Gửi lại OTP (Resend Verification)

**Endpoint:** `POST /api/v1/auth/resend-verification`

```
Client                              Service                              DB / Email
  │                                    │                                     │
  │── POST /resend-verification ──────▶│                                     │
  │   {email}                          │                                     │
  │                                    │                                     │
  │                           findUserByEmail(email)                         │
  │                            → 404 nếu không tồn tại                      │
  │                            → 400 nếu đã verified                        │
  │                                    │                                     │
  │                            generateOTP() → OTP mới                       │
  │                            createEmailVerification(...) → INSERT mới     │
  │                            [record cũ KHÔNG bị xóa, dùng token mới nhất]│
  │                                    │                                     │
  │                            sendVerificationEmail() [non-blocking] ──────▶ SMTP
  │                                    │                                     │
  │◀──── 200 "Verification email resent" ──────────────────────────────────  │
```

---

## 4. Đăng nhập (Login)

**Endpoint:** `POST /api/v1/auth/login`

```
Client                        Middleware              Service                  DB
  │                               │                      │                     │
  │── POST /login ───────────────▶│                      │                     │
  │   {email, password}           │                      │                     │
  │   User-Agent header           │                      │                     │
  │                          validate.js                 │                     │
  │                     (Joi: email, password required)  │                     │
  │                               │                      │                     │
  │                               │── gọi controller ───▶│                     │
  │                               │                      │                     │
  │                               │              findUserByEmail(email)        │
  │                               │                      │───────────────────▶│
  │                               │                      │◀── user             │
  │                               │                      │                     │
  │                               │              Kiểm tra:                     │
  │                               │              1. user tồn tại?              │
  │                               │                 → không → 401              │
  │                               │              2. user.is_active?            │
  │                               │                 → false → 403 "Disabled"   │
  │                               │                      │                     │
  │                               │              comparePassword(              │
  │                               │                password, user.password_hash)
  │                               │              [bcrypt.compare]              │
  │                               │              → không khớp → 401            │
  │                               │                      │                     │
  │                               │              generateAccessToken(payload)  │
  │                               │              [JWT, 15m, ACCESS_SECRET,     │
  │                               │               jti: randomUUID()]           │
  │                               │                      │                     │
  │                               │              generateRefreshToken(payload) │
  │                               │              [JWT, 7d, REFRESH_SECRET,     │
  │                               │               jti: randomUUID()]           │
  │                               │                      │                     │
  │                               │              tokenHash = sha256(rawToken)  │
  │                               │              [crypto.createHash('sha256')] │
  │                               │                      │                     │
  │                               │              createRefreshToken(           │
  │                               │                userId, tokenHash,          │
  │                               │                expiresAt, deviceInfo)      │
  │                               │                      │───────────────────▶│
  │                               │                      │  INSERT refresh_tokens
  │                               │                      │  (token_hash, ...)  │
  │                               │                      │                     │
  │                               │              encryptedToken =              │
  │                               │              AES-256-GCM(rawToken, KEY)    │
  │                               │              [tokenCrypto.encrypt()]       │
  │                               │                      │                     │
  │◀──── 200 ─────────────────────│                      │                     │
  │  {                            │                      │                     │
  │    accessToken,  (15 phút)    │                      │                     │
  │    user: { id, email, … }     │                      │                     │
  │  }  [password_hash bị loại]   │                      │                     │
  │                               │                      │                     │
  │  Set-Cookie: refreshToken=    │                      │                     │
  │    <AES-256-GCM blob>         │                      │                     │
  │  [httpOnly; SameSite=Lax;     │                      │                     │
  │   Secure (prod); MaxAge=7d]   │                      │                     │

Lưu ý: payload = { userId, email, jti }  ← jti = crypto.randomUUID()
        deviceInfo lấy từ User-Agent header
        refreshToken KHÔNG trả trong body — chỉ qua httpOnly cookie
        Cookie chứa AES-256-GCM encrypted blob (không phải raw JWT)
        DB lưu SHA-256 hash của raw JWT (không lưu raw, không lưu encrypted)
```

---

## 5. Gọi API được bảo vệ (Authenticated Request)

**Áp dụng cho tất cả endpoint yêu cầu auth (middleware `authenticate.js`)**

```
Client                      authenticate.js (async)            Handler
  │                               │                               │
  │── GET /auth/me ──────────────▶│                               │
  │   Authorization: Bearer <AT>  │                               │
  │                               │                               │
  │                        Kiểm tra header:                       │
  │                        startsWith("Bearer ")?                 │
  │                        → không → 401 "Unauthorized"           │
  │                               │                               │
  │                        [1] verifyAccessToken(token)           │
  │                        [jwt.verify(token, ACCESS_SECRET)]     │
  │                        → lỗi/hết hạn → 401 "Invalid token"   │
  │                               │                               │
  │                        [2] isBlacklisted(decoded.jti)         │
  │                        [Redis EXISTS blacklist:<jti>]         │
  │                        → true → 401 "Token has been revoked"  │
  │                               │                               │
  │                        [3] findUserById(decoded.userId)       │
  │                        → is_active = false → 401              │
  │                        → tokens_valid_after > decoded.iat     │
  │                           → 401 "Session invalidated"         │
  │                               │                               │
  │                        req.user = { userId, email, jti, … }  │
  │                               │                               │
  │                               │────── next() ────────────────▶│
  │◀──── 200 { user } ────────────│                               │

Ghi chú: authenticate.js giờ là async — mỗi request thực hiện:
         [Redis] EXISTS blacklist:<jti>  (~0.1ms, in-memory)
         [DB]    findUserById(userId)    (kiểm tra is_active + tokens_valid_after)
```

---

## 6. Làm mới Token (Refresh Token)

**Endpoint:** `POST /api/v1/auth/refresh`

```
Client                              Service                              DB
  │                                    │                                  │
  │── POST /refresh ──────────────────▶│                                  │
  │   Cookie: refreshToken=<encrypted> │                                  │
  │   [tự động gửi bởi browser]        │                                  │
  │                                    │                                  │
  │                           encrypted = req.cookies.refreshToken        │
  │                           → không có cookie → 400                     │
  │                                    │                                  │
  │                           rawToken = AES-256-GCM-decrypt(encrypted)   │
  │                           [tokenCrypto.decrypt()]                     │
  │                           → tampered/invalid → throw (→ 500/401)      │
  │                                    │                                  │
  │                           verifyRefreshToken(rawToken)                │
  │                           [jwt.verify(rawToken, REFRESH_SECRET)]      │
  │                           → lỗi → 401 "Invalid or expired"            │
  │                                    │                                  │
  │                           findRefreshToken(sha256(rawToken))          │
  │                           [lookup bằng hash, không phải raw]          │
  │                                    │─────────────────────────────────▶│
  │                                    │◀──────────── stored record        │
  │                                    │                                  │
  │                            [1] record tồn tại?                        │
  │                               → không → 401                           │
  │                                    │                                  │
  │                            [2] stored.is_revoked = true?              │
  │                               → REUSE DETECTED ──────────────────────▶│
  │                                 revokeAllUserTokens(user_id)          │
  │                                 invalidateAllUserTokens(user_id)      │
  │                                 [tokens_valid_after = NOW()]          │
  │                               → 401 "Security alert: reuse detected"  │
  │                                    │                                  │
  │                            [3] stored.expires_at < now?               │
  │                               → 401 "Token expired"                   │
  │                                    │                                  │
  │                           findUserById(decoded.userId)                │
  │                            → không tồn tại / inactive → 401          │
  │                                    │                                  │
  │                           ── Rotation ──────────────────────────────  │
  │                           revokeRefreshToken(sha256(oldToken))        │
  │                           newRT = generateRefreshToken(payload)       │
  │                           createRefreshToken(sha256(newRT), ...)      │
  │                                    │─────────────────────────────────▶│
  │                                    │                                  │
  │                           newAT = generateAccessToken(payload)        │
  │                                    │                                  │
  │◀──── 200 { accessToken } ──────────│                                  │
  │   Set-Cookie: refreshToken=        │                                  │
  │     encrypt(newRT)  ← RT MỚI       │                                  │

Ghi chú: Mỗi lần /refresh → RT cũ bị revoke, RT mới được cấp (rotation).
         RT cũ bị dùng lại (is_revoked=true) → security alert → nuke all sessions.
         tokens_valid_after invalidates mọi AT đang bay trong không trung.
```

---

## 7. Đăng xuất (Logout)

**Endpoint:** `POST /api/v1/auth/logout`

```
Client                              Service                              DB
  │                                    │                                  │
  │── POST /logout ───────────────────▶│                                  │
  │   Authorization: Bearer <AT>       │                                  │
  │   Cookie: refreshToken=<encrypted> │                                  │
  │                                    │                                  │
  │                           [1] decode AT từ Authorization header       │
  │                           (best-effort, không throw nếu expired)      │
  │                                    │                                  │
  │                           [2] decrypt(cookie) → rawToken              │
  │                           revokeRefreshToken(sha256(rawToken))        │
  │                           [cookie tampered? → bỏ qua]                │
  │                                    │─────────────────────────────────▶│
  │                                    │  is_revoked = true               │
  │                                    │                                  │
  │                           [3] addToBlacklist(                         │
  │                                AT.jti, userId,                        │
  │                                'logout', AT.exp)                      │
  │                           [non-blocking — không fail logout]          │
  │                                    │                                  │
  │                           Redis SET blacklist:<jti> "logout"          │
  │                                    EX <ttl_seconds> NX               │
  │                           [TTL = thời gian còn lại của AT;            │
  │                            Redis auto-xóa khi hết TTL]               │
  │                                    │                                  │
  │                           res.clearCookie('refreshToken')             │
  │                                    │                                  │
  │◀──── 200 "Logged out" ─────────────│                                  │
  │   Set-Cookie: refreshToken=;       │                                  │
  │   Expires=Thu, 01 Jan 1970 ...     │                                  │

Ghi chú:
  - RT bị revoke trong DB (is_revoked = true) + cookie bị xóa khỏi browser.
  - AT bị blacklist ngay lập tức trong Redis theo jti → không cần chờ 15 phút.
  - Redis tự xóa key khi TTL hết — không cần cleanup job.
  - Chỉ revoke session hiện tại (1 thiết bị).
```

---

## 8. Quên mật khẩu (Forgot Password)

**Endpoint:** `POST /api/v1/auth/forgot-password`

```
Client                              Service                          DB / Email
  │                                    │                                │
  │── POST /forgot-password ──────────▶│                                │
  │   {email}                          │                                │
  │                                    │                                │
  │                           findUserByEmail(email)                    │
  │                            → không tồn tại: RETURN SILENTLY         │
  │                              (không tiết lộ email có hay không)     │
  │                                    │                                │
  │                           token = crypto.randomBytes(32).hex()      │
  │                           [64 ký tự hex, KHÔNG phải JWT]            │
  │                           expiresAt = now + 1 giờ                   │
  │                                    │                                │
  │                           createEmailVerification(                  │
  │                             userId, token, 'reset_password')        │
  │                                    │──────────────────────────────▶│
  │                                    │                                │
  │                           sendPasswordResetEmail()                  │
  │                           [non-blocking] ──────────────────────────▶ SMTP
  │                           URL trong email:                          │
  │                           {FRONTEND_URL}/reset-password?token=...   │
  │                                    │                                │
  │◀──── 200 "If email exists, link sent" ──────────────────────────── │
  │      [Response giống nhau dù email có tồn tại hay không]            │
```

---

## 9. Đặt lại mật khẩu (Reset Password)

**Endpoint:** `POST /api/v1/auth/reset-password`

```
Client                              Service                              DB
  │                                    │                                  │
  │── POST /reset-password ───────────▶│                                  │
  │   {token, password}                │                                  │
  │                                    │                                  │
  │                           findEmailVerification(                      │
  │                             token, 'reset_password')                  │
  │                                    │─────────────────────────────────▶│
  │                                    │◀──────────── record               │
  │                                    │                                  │
  │                            Kiểm tra tuần tự:                          │
  │                            1. record tồn tại?                         │
  │                               → không → 400 "Invalid reset token"     │
  │                            2. record.used_at IS NOT NULL?              │
  │                               → có   → 400 "Token already used"       │
  │                            3. record.expires_at < now?                 │
  │                               → có   → 400 "Token expired"            │
  │                                    │                                  │
  │                           hashPassword(newPassword)                   │
  │                           [bcrypt, password min 6 ký tự]             │
  │                                    │                                  │
  │                           markEmailVerificationUsed(record.id)        │
  │                           updateUser(userId, {password_hash})         │
  │                           revokeAllUserTokens(userId)                 │
  │                           [Thu hồi TẤT CẢ refresh tokens của user]   │
  │                           invalidateAllUserTokens(userId)             │
  │                           [tokens_valid_after = NOW()                 │
  │                            → AT cũ bị vô hiệu tức thì]               │
  │                                    │─────────────────────────────────▶│
  │                                    │                                  │
  │◀──── 200 "Password reset. Login again." ───────────────────────────── │
```

---

## 10. Sơ đồ trạng thái Token

```
                        ┌─────────────────────────────────┐
                        │           CHƯA ĐĂNG NHẬP        │
                        └──────────────────┬──────────────┘
                                           │ POST /login (thành công)
                                           ▼
                        ┌─────────────────────────────────┐
                        │  CÓ accessToken (15m) +          │
                        │  CÓ refreshToken (7d, DB)        │
                        └────┬────────────────────────┬───┘
                             │                        │
            accessToken hết hạn (401)                 │ POST /logout
                             │                        │
                             ▼                        ▼
              ┌──────────────────────┐   ┌───────────────────────────┐
              │ POST /auth/refresh   │   │  refreshToken.is_revoked  │
              │ Cookie: encrypted    │   │  = true trong DB          │
              │                      │   │  → Client xóa localStorage│
              │ Kiểm tra:            │   └───────────────────────────┘
              │ 0. decrypt cookie    │
              │ 1. JWT hợp lệ?       │
              │ 2. is_revoked?       │──── YES → REUSE DETECTED ──────────▶ ┌──────────────────────────┐
              │ 3. expires_at > now? │                                       │ revokeAllUserTokens()    │
              └──────┬───────────────┘                                       │ invalidateAllUserTokens()│
                     │ thành công                                            │ 401 Security Alert       │
                     ▼                                                       └──────────────────────────┘
              ┌──────────────────────┐
              │  accessToken mới     │
              │  (15 phút, jti mới)  │
              │  refreshToken MỚI    │  ← Rotation: RT cũ revoked
              │  (cookie cập nhật)   │
              └──────────────────────┘

Khi logout:
  → revokeRefreshToken() → RT thiết bị hiện tại bị thu hồi
  → addToBlacklist(AT.jti) → AT bị vô hiệu ngay lập tức

Khi reset-password:
  → revokeAllUserTokens()    → TẤT CẢ RT bị thu hồi
  → invalidateAllUserTokens() → tokens_valid_after = NOW()
  → AT cũ trên mọi thiết bị bị vô hiệu tức thì
```

---

## 11. Bảng tóm tắt Endpoint

| Endpoint | Method | Auth | Mô tả |
|---|---|:---:|---|
| `/auth/register` | POST | ❌ | Tạo tài khoản, gửi OTP email |
| `/auth/verify-email` | POST | ❌ | Xác thực email bằng OTP 6 chữ số |
| `/auth/resend-verification` | POST | ❌ | Gửi lại OTP mới (TTL 15 phút) |
| `/auth/login` | POST | ❌ | Đăng nhập, nhận accessToken + refreshToken |
| `/auth/refresh` | POST | ❌ | Lấy accessToken mới từ refreshToken |
| `/auth/logout` | POST | ❌ | Revoke refreshToken hiện tại |
| `/auth/me` | GET | ✅ JWT | Thông tin user đang đăng nhập |
| `/auth/forgot-password` | POST | ❌ | Gửi link reset mật khẩu vào email |
| `/auth/reset-password` | POST | ❌ | Đổi mật khẩu, revoke tất cả tokens |

---

## 12. Storage liên quan đến Auth

### PostgreSQL

| Bảng | Vai trò trong Auth |
|---|---|
| `users` | Lưu tài khoản: `email`, `password_hash`, `is_verified`, `is_active`, `tokens_valid_after` |
| `refresh_tokens` | Lưu refresh token: `token_hash` (SHA-256, VARCHAR 64), `expires_at`, `is_revoked`, `device_info` |
| `email_verifications` | Lưu OTP/reset-token: `token`, `type` (`verify_email` / `reset_password`), `expires_at`, `used_at` |

**`users.tokens_valid_after`**: timestamp mass revocation — mọi AT có `iat < tokens_valid_after` đều bị từ chối.
Được set khi: reuse detected, reset password, admin disable account.

### Redis

| Key pattern | Value | TTL | Mục đích |
|---|---|---|---|
| `blacklist:<jti>` | `"logout"` / `"admin_revoke"` | Thời gian còn lại của AT (tự động) | Blacklist AT tức thì sau logout/revoke |

**Tại sao Redis thay vì Postgres cho blacklist?**
- **Tốc độ**: O(1) EXISTS ~0.1ms (in-memory) vs ~1-5ms (disk I/O)
- **Tự dọn dẹp**: TTL auto-expire, không cần `DELETE WHERE expires_at < NOW()` định kỳ
- **Scale**: 15 phút TTL × traffic cao = triệu rows trong Postgres; Redis xử lý nhẹ nhàng

**Cấu hình Redis** (`docker-compose.yml` / `configs/redis.js`):
- Image: `redis:7-alpine`, port `6379`, password required
- `maxmemory 128mb`, policy `allkeys-lru` (xóa key ít dùng nhất khi hết RAM)
- Persistent: `redis_data` volume, `appendonly yes`

---

## 13. Luồng Frontend (Axios Interceptor)

```
Frontend (axiosInstance.js)
  │
  ├── Cấu hình: withCredentials: true
  │     └── Browser tự đính kèm httpOnly cookie vào mọi request đến cùng origin
  │
  ├── Request Interceptor
  │     └── Thêm header: Authorization: Bearer <accessToken từ localStorage>
  │
  └── Response Interceptor
        └── Nhận lỗi 401?
              │
              ├── Đã đang refresh? → Đưa request vào hàng đợi (queue)
              │
              └── Chưa refresh → POST /auth/refresh {}
                    │  [không cần body — browser tự gửi cookie]
                    ├── Thành công → Lưu accessToken mới vào localStorage
                    │               → Retry toàn bộ queue
                    └── Thất bại   → Xóa token + user khỏi localStorage
                                    → Redirect /login

Lưu ý lưu trữ:
  localStorage    → accessToken, user (readable by JS, cần thiết cho app)
  httpOnly cookie → refreshToken dạng AES-256-GCM encrypted blob
                    KHÔNG readable by JS (chống XSS)
                    KHÔNG phải raw JWT (chống browser malware/cookie theft)
  KHÔNG còn refreshToken trong localStorage
```