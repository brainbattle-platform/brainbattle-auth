# BrainBattle Auth Service

Custom **authentication microservice** for the BrainBattle app, built with **NestJS**.
Supports **email sign-up with OTP**, **password-based login**, **Google/Facebook OAuth2**,
**forgot/reset password**, **refresh token rotation** with revoke, and **logout**.

---

## ✨ Features

- Email registration flow: **request OTP → verify OTP → set password**
- Password login (email + password)
- **Google** & **Facebook** OAuth2 login / connect
- Forgot password → email link/token → reset password
- **JWT** authentication:
  - **Access token** (default: 15m)
  - **Refresh token** (default: 30d) with **rotation + revoke**
- Account session management & logout (single device or all devices)
- Secure mail delivery via real SMTP server (already available)
- Rate limiting, CORS, Helmet, and robust validation (class-validator)

---

## 🧱 Tech Stack

- **NestJS** (REST) + **Passport** strategies (JWT, Google, Facebook)
- **Prisma** ORM + **PostgreSQL**
- **JWT RS256** (public/private keys)
- **Nodemailer** for SMTP
- Optional: **Docker Compose** for local dev

---

## 🗃️ Proposed Database (Prisma models)

- `User` — profile (id, email, name, avatar, …)
- `UserCredential` — password hash, password version, userId (1–1)
- `UserProvider` — OAuth links (provider, providerUserId, userId)
- `OtpCode` — email OTP (code, purpose, expiresAt, attempts…)
- `RefreshSession` — hashed refresh token, userId, device info, revokedAt
- (Optional) `AuditLog` for security events

> Tách OTP và Refresh Session giúp audit & bảo mật rõ ràng, dễ revoke.

---

## 🔐 Token Policy (default)

- `ACCESS_TOKEN_TTL=900s` (15 phút)
- `REFRESH_TOKEN_TTL=30d`
- **Rotation**: mỗi lần refresh sinh token mới và **revoke** token cũ
- **RS256**: ký bằng `JWT_PRIVATE_KEY`, verify bằng `JWT_PUBLIC_KEY`
- JWT claims: `sub` (userId), `email`, `roles`, `iat`, `exp`, `iss`, `aud`

---

## 📡 API Endpoints

> Prefix gợi ý: `/auth`

### Email & Password
- `POST /auth/register/request-otp` — `{ email }` → gửi OTP
- `POST /auth/register/verify-otp` — `{ email, otp }` → token tạm `register_token`
- `POST /auth/register/set-password` — `{ register_token, password }` → tạo tài khoản
- `POST /auth/login` — `{ email, password }` → `{ access_token, refresh_token }`
- `POST /auth/forgot-password` — `{ email }` → gửi mail đặt lại mật khẩu
- `POST /auth/reset-password` — `{ reset_token, new_password }`
- `POST /auth/logout` — Headers: `Authorization: Bearer <access>`; Body: `{ allDevices?: boolean }`
- `POST /auth/refresh` — `{ refresh_token }` → rotate
- `GET  /auth/me` — trả user info (yêu cầu access token)

### OAuth (Google/Facebook)
- `GET  /auth/google` → OAuth init (redirect)
- `GET  /auth/google/callback` → nhận code, login/attach, trả tokens
- `GET  /auth/facebook` → OAuth init (redirect)
- `GET  /auth/facebook/callback` → nhận code, login/attach, trả tokens

> Tuỳ FE/mobile, có thể dùng **PKCE + OAuth on backend** hoặc **one-tap** (Google).

---

## 🧩 Request/Response Samples

**Register – request OTP**
```http
POST /auth/register/request-otp
Content-Type: application/json

{ "email": "user@example.com" }
