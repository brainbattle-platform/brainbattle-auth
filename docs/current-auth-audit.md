# Current BrainBattle Auth Audit

Date: 2026-04-11
Repository: brainbattle-auth
Scope: Read-only audit of current implementation. No runtime code changes.

## Assumptions and audit boundaries

- This audit reflects only what is implemented in source today, not what README claims.
- Folder scan confirmed [docs](docs), [scripts](scripts) are currently empty.
- No env example file is present (no .env.example / .env.local.example discovered).
- Some test files appear stale versus current code; they are treated as historical intent, not reliable behavior proof.

# 1. Service overview

## Current purpose

Current service is a NestJS-based auth and identity service that handles:

- Email/password registration and login
- OTP-based email verification for register and password reset
- Refresh token session rotation and revoke
- OAuth callback handling for Google/Facebook
- Basic user profile endpoints and admin user management endpoints
- JWKS publication for JWT public key distribution
- Avatar upload to MinIO-compatible object storage

Core entrypoint and module wiring are in [src/main.ts](src/main.ts) and [src/app.module.ts](src/app.module.ts).

## Business responsibilities currently handled

Implemented responsibilities go beyond pure authentication:

- Auth core: register/login/refresh/logout/forgot password in [src/auth/auth.controller.ts](src/auth/auth.controller.ts) and [src/auth/auth.service.ts](src/auth/auth.service.ts)
- OAuth account linking/creation in [src/auth/oauth.controller.ts](src/auth/oauth.controller.ts) and [src/auth/auth.service.ts](src/auth/auth.service.ts)
- User profile read/update + avatar upload in [src/users/users.controller.ts](src/users/users.controller.ts)
- Admin user listing/update/ban in [src/users/admin.controller.ts](src/users/admin.controller.ts)
- Key distribution endpoint in [src/jwks/jwks.controller.ts](src/jwks/jwks.controller.ts)

## Frameworks/libraries in use

From [package.json](package.json):

- Framework: NestJS 11
- ORM/DB: Prisma + PostgreSQL
- Auth libs: jsonwebtoken, Passport, passport-google-oauth20, passport-facebook, passport-jwt
- Password hashing: argon2 and bcrypt (both used in different flows)
- Validation/docs: class-validator, class-transformer, Swagger
- Mail: nodemailer
- Storage: AWS SDK S3 client (used for MinIO)

## Architectural style

- Modular monolith (Nest modules), organized by feature folders
- Controller-service-ORM pattern
- Stateless JWT access tokens + stateful DB-backed refresh sessions
- No event-driven or hexagonal abstraction layer yet
- Responsibilities are mixed (auth + identity/profile/admin/media in same service)

# 2. Project structure

## Major folders and key files

- [src](src): Application runtime code
- [src/auth](src/auth): Auth flows, token logic, OTP, OAuth controllers/strategies
- [src/users](src/users): User profile and admin APIs
- [src/jwks](src/jwks): JWKS endpoint for public key exposure
- [src/mail](src/mail): SMTP mail sending
- [src/storage](src/storage): MinIO upload integration
- [src/common](src/common): custom filter and JWT guard
- [prisma](prisma): schema, migrations, seed script
- [test](test): e2e test setup (currently stale against app behavior)
- [docs](docs): empty except this new audit
- [scripts](scripts): empty

## Main entrypoints

- App bootstrap: [src/main.ts](src/main.ts)
- Root module: [src/app.module.ts](src/app.module.ts)
- Runtime container command: [Dockerfile](Dockerfile) executes dist/src/main.js

## Config files and what they control

- [package.json](package.json): scripts, dependencies, Jest config, Prisma seed command
- [tsconfig.json](tsconfig.json), [tsconfig.build.json](tsconfig.build.json): TS compile settings and build exclusions
- [nest-cli.json](nest-cli.json): Nest build source root and output cleaning
- [eslint.config.mjs](eslint.config.mjs): lint rules
- [.prettierrc](.prettierrc): formatting preferences
- [docker-compose.yml](docker-compose.yml): local Postgres service
- [Dockerfile](Dockerfile): multi-stage build and runtime image
- [.env](.env): runtime env values currently committed in workspace

# 3. Current auth-related modules and flows

## Module map

- Auth module: [src/auth/auth.module.ts](src/auth/auth.module.ts)
- Token service: [src/auth/tokens.service.ts](src/auth/tokens.service.ts)
- OTP service: [src/auth/otp.service.ts](src/auth/otp.service.ts)
- Email/password controller: [src/auth/auth.controller.ts](src/auth/auth.controller.ts)
- OAuth controller: [src/auth/oauth.controller.ts](src/auth/oauth.controller.ts)
- Simple username/password endpoints: [src/auth/simple-auth.controller.ts](src/auth/simple-auth.controller.ts)
- Guard (manual JWT verification): [src/common/guards/jwt-auth.guard.ts](src/common/guards/jwt-auth.guard.ts)

## Flow-by-flow audit

### Signup/register

- Route: POST /auth/register/start and POST /auth/register/verify in [src/auth/auth.controller.ts](src/auth/auth.controller.ts)
- Services: AuthService + OtpService + MailService + UsersService + TokensService
- DTOs: RegisterStartDto, RegisterVerifyDto
- Guards/interceptors/middleware: none on these routes
- DB models: User, EmailOtp, Session
- Behavior:
  - start: validates email existence and sends OTP
  - verify: verifies OTP, creates or updates user, issues access+refresh tokens
- Status: Active, mostly complete
- Notes:
  - Also contains legacy register(email,password) method in service not exposed by controller

### Login

- Route: POST /auth/login in [src/auth/auth.controller.ts](src/auth/auth.controller.ts)
- Services: AuthService (argon2 verify), TokensService
- DTOs: LoginDto
- Guards: none
- DB models: User, Session
- Status: Active, complete for email/password users

### Logout

- Route: POST /auth/logout
- Services: AuthService
- DTOs: LogoutDto
- Guard: none (takes refresh token in body)
- DB models: Session
- Behavior: verifies refresh token; revokes session by sid; ignores invalid token and returns ok
- Status: Active, complete but minimal

### Refresh token

- Route: POST /auth/refresh
- Services: AuthService + TokensService
- DTOs: RefreshDto
- Guard: none
- DB models: Session, User
- Behavior: verifies refresh JWT, checks session validity, verifies hash, rotates stored hash, returns new tokens
- Status: Active, complete

### Forgot password

- Route: POST /auth/forgot/start
- Services: AuthService + OtpService + MailService
- DTOs: ForgotStartDto
- Guard: none
- DB models: User, EmailOtp
- Behavior: non-enumerating response for unknown users; sends OTP for password users
- Status: Active, complete

### Reset password

- Route: implemented as POST /auth/forgot/verify (no separate /reset-password endpoint)
- Services: AuthService + OtpService + UsersService
- DTOs: ForgotVerifyDto
- Guard: none
- DB models: User, Session, EmailOtp
- Behavior: verifies OTP and writes new passwordHash; revokes all sessions for that user
- Status: Active but naming is blended with forgot flow

### OTP/email verification

- OTP storage/validation: [src/auth/otp.service.ts](src/auth/otp.service.ts)
- OTP purpose supported: register and reset
- DB model: EmailOtp (one record per email)
- Status: Active, complete for current use cases
- Notes:
  - Purpose is a plain string field; no enum constraint
  - OTP attempt counting/lockout not implemented

### Google OAuth

- Routes: GET /oauth/google and GET /oauth/google/callback
- Services: OauthController + AuthService.oauthLogin
- Strategies: GoogleStrategy exists in [src/auth/oauth/google.strategy.ts](src/auth/oauth/google.strategy.ts)
- Guard: AuthGuard('google')
- DB models: Account, User, Session
- Status: Partial/non-functional in current wiring
- Critical detail:
  - Strategy providers are commented out in [src/auth/auth.module.ts](src/auth/auth.module.ts), so guard strategy registration likely missing at runtime

### Facebook OAuth

- Routes: GET /oauth/facebook and GET /oauth/facebook/callback
- Services: OauthController + AuthService.oauthLogin
- Strategies: FacebookStrategy exists in [src/auth/oauth/facebook.strategy.ts](src/auth/oauth/facebook.strategy.ts)
- Guard: AuthGuard('facebook')
- DB models: Account, User, Session
- Status: Partial/non-functional in current wiring for same reason as Google

### Profile/me endpoint

- No authenticated me endpoint currently exposed in controllers.
- Existing profile endpoints are userId-path based:
  - GET /users/:userId/profile
  - PATCH /users/:userId/profile
- Both are unguarded currently.
- Status: Me endpoint missing; profile APIs active but not access-controlled

### Role/permission related logic

- Role field exists on User model (USER/ADMIN by convention)
- Admin routes exist under /admin
- No role guard or permission middleware is implemented in controllers
- Status: Partial

### Session management logic

- Implemented through Session table:
  - create session on token issuance
  - hash refresh token in DB
  - rotate hash on refresh
  - revoke on logout and password reset
- No device/session listing endpoint yet
- Status: Active and meaningful

# 4. JWT and token architecture

## Access token generation

- Generated in TokensService.signAccessToken in [src/auth/tokens.service.ts](src/auth/tokens.service.ts)
- Claims: sub, roles
- Algorithm: RS256
- Signed with JWT_PRIVATE_KEY_BASE64 decoded PEM
- Includes issuer, audience, kid, expiresIn

## Refresh token generation

- Generated in TokensService.signRefreshToken in [src/auth/tokens.service.ts](src/auth/tokens.service.ts)
- Claims: sub (userId), sid (sessionId)
- Algorithm: RS256
- Signed with same private key and constraints
- AuthService stores argon2 hash in Session.refreshHash

## Key/secret sources

- Keys are read from environment base64 values:
  - JWT_PRIVATE_KEY_BASE64
  - JWT_PUBLIC_KEY_BASE64
- Issuer/audience env names used by runtime code:
  - JWT_ISS
  - JWT_AUD
- Key id optional: JWT_KID

## Verification implementation

- Access/refresh verify in TokensService using jsonwebtoken.verify with:
  - algorithms: RS256 only
  - issuer and audience checks
- JwtAuthGuard manually parses Authorization header and calls tokens.verifyAccess

## Inter-service verification expectation

- Service exposes JWKS at /.well-known/jwks.json in [src/jwks/jwks.controller.ts](src/jwks/jwks.controller.ts)
- JWKS built dynamically from JWT_PUBLIC_KEY_BASE64 and optional kid
- Intended model: other services fetch JWKS and verify RS256 access tokens

## Likely reasons verification fails across services

- Env name mismatch between runtime and tests/docs:
  - runtime expects JWT_ISS/JWT_AUD
  - tests use JWT_ISSUER/JWT_AUDIENCE in [src/auth/tokens.service.spec.ts](src/auth/tokens.service.spec.ts)
- Missing/invalid base64 key material (empty decoded key)
- Issuer/audience mismatch between token producer and consumer
- kid mismatch or absent kid while verifiers pin kid
- Consumers expecting symmetric HS* instead of RS256
- Clock skew and exp checks

## Security and architecture concerns

- Profile/admin routes are unguarded despite sensitive operations
- Logout/refresh rely on token in request body instead of secure cookie pattern
- OTP model has no attempt counter/anti-bruteforce
- OAuth accessToken/refreshToken from providers stored plaintext in Account table
- Mixed bcrypt and argon2 password hashing across auth paths increases maintenance complexity

# 5. Database / Prisma model audit

Source: [prisma/schema.prisma](prisma/schema.prisma) + migration history in [prisma/migrations](prisma/migrations)

## User

- Purpose: Primary identity + profile + role/status store
- Important fields:
  - id, username?, email, passwordHash?
  - displayName, bio, avatarUrl
  - rankCode, status, role
  - emailVerified, createdAt, updatedAt
- Relationships:
  - one-to-many Session
  - one-to-many Account
- Usage in code:
  - Auth credential checks and token issuance
  - Profile and admin management
  - OAuth account linking
- Domain classification: Mixed auth core + identity/profile + admin domain

## Session

- Purpose: Refresh-token session record with revocation/expiry
- Important fields: id, userId, refreshHash, revokedAt, expiresAt, userAgent, ip
- Relationships: belongs to User
- Usage:
  - create on login/register/oauth
  - verify/rotate on refresh
  - revoke on logout and forgot-verify
- Domain classification: Auth core

## EmailOtp

- Purpose: OTP challenge storage for register/reset
- Important fields: email unique, codeHash, purpose, expiresAt, resendAt
- Usage: OtpService create/resend/verify/consume
- Domain classification: Auth core

## Account

- Purpose: OAuth provider linkage for a user
- Important fields: provider, providerAccountId, provider tokens
- Relationships: belongs to User
- Usage: oauthLogin lookup/update/create
- Domain classification: Auth core (federated identity)

## Requested model-name mapping check

- User: present
- UserCredential: not present (credential data is embedded in User.passwordHash)
- UserProvider: not present (implemented as Account)
- OtpCode: not present (implemented as EmailOtp)
- RefreshSession: not present (implemented as Session)
- Profile/role/session tables:
  - Profile fields are inside User
  - Role/status are inside User
  - Session table exists
  - No dedicated audit log table

# 6. API inventory

All controller-exposed endpoints currently found:

| Method | Path | Purpose | Auth required | Controller | Status guess |
|---|---|---|---|---|---|
| GET | /health | Service health check | No | HealthController | Active |
| POST | /auth/register/start | Start signup, send OTP | No | AuthController | Active |
| POST | /auth/register/verify | Verify OTP + set password + issue tokens | No | AuthController | Active |
| POST | /auth/login | Email/password login | No | AuthController | Active |
| POST | /auth/refresh | Rotate refresh token and issue new access | No (refresh token in body) | AuthController | Active |
| POST | /auth/logout | Revoke refresh session | No (refresh token in body) | AuthController | Active |
| POST | /auth/forgot/start | Start forgot flow, send OTP | No | AuthController | Active |
| POST | /auth/forgot/verify | Verify OTP and reset password | No | AuthController | Active |
| POST | /auth/simple/signup | Username/password signup (no JWT issue) | No | SimpleAuthController | Active/parallel auth path |
| POST | /auth/simple/login | Username/password login (no JWT issue) | No | SimpleAuthController | Active/parallel auth path |
| GET | /oauth/google | Start Google OAuth | No | OauthController | Partial (strategy likely not wired) |
| GET | /oauth/google/callback | Google OAuth callback -> issue tokens | No | OauthController | Partial (strategy likely not wired) |
| GET | /oauth/facebook | Start Facebook OAuth | No | OauthController | Partial (strategy likely not wired) |
| GET | /oauth/facebook/callback | Facebook OAuth callback -> issue tokens | No | OauthController | Partial (strategy likely not wired) |
| GET | /.well-known/jwks.json | Publish JWT verification keys | Public | JwksController | Active |
| GET | /users/:userId/profile | Read profile by userId | No | UsersController | Active but risky |
| PATCH | /users/:userId/profile | Update profile by userId | No | UsersController | Active but risky |
| POST | /users/:userId/avatar | Upload avatar to MinIO | No | UsersController | Active but risky |
| GET | /admin/users | List users (admin intent) | No | AdminController | Active but risky |
| GET | /admin/users/:userId | Get user details (admin intent) | No | AdminController | Active but risky |
| PATCH | /admin/users/:userId | Update user fields including role/status | No | AdminController | Active but risky |
| DELETE | /admin/users/:userId | Soft-ban user | No | AdminController | Active but risky |

Notes:

- No /auth/me endpoint currently implemented.
- No dedicated reset-password route name; reset is mapped to forgot/verify.

# 7. Environment and infrastructure

## Required environment variables identified from code

Database and app:

- DATABASE_URL
- PORT

JWT and JWKS:

- JWT_PRIVATE_KEY_BASE64
- JWT_PUBLIC_KEY_BASE64
- JWT_ISS
- JWT_AUD
- JWT_KID (optional)
- JWT_ACCESS_TTL (optional default 900)
- JWT_REFRESH_TTL (optional default 2592000)

OTP and mail:

- OTP_TTL (optional default 600)
- OTP_RESEND_COOLDOWN (optional default 60)
- OTP_LENGTH (optional default 6)
- SMTP_HOST
- SMTP_PORT (optional default 587)
- SMTP_USER
- SMTP_PASS
- MAIL_FROM

OAuth:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- FACEBOOK_CLIENT_ID
- FACEBOOK_CLIENT_SECRET
- FACEBOOK_REDIRECT_URI

Storage:

- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET
- MINIO_PUBLIC_BASE_URL
- MINIO_REGION

Other env in .env but not used in code:

- ADMIN_API_KEY appears in [.env](.env) but no runtime references found.

## Docker and docker-compose usage

- [Dockerfile](Dockerfile): two-stage Node 20 build, prisma generate in both stages, starts dist/src/main.js
- [docker-compose.yml](docker-compose.yml): only Postgres service named db exposing 5433:5432
- Current [.env](.env) uses host auth-db in DATABASE_URL, which does not match compose service name db in this repo

## Local run steps inferred

- Install deps: npm install
- Prisma generate/migrate: npm run prisma:generate, npm run prisma:migrate
- Start dev: npm run start:dev
- Swagger UI: /docs path from [src/main.ts](src/main.ts)

## Build steps

- npm run build
- production run: npm run start:prod

## Migration/seed scripts

- Prisma migrations in [prisma/migrations](prisma/migrations)
- Seed command in package.json uses ts-node prisma/seed.ts
- Seed creates admin and 100 users with known default passwords in [prisma/seed.ts](prisma/seed.ts)

## Swagger/OpenAPI support

- Enabled globally in [src/main.ts](src/main.ts)
- Exposed at /docs
- Bearer scheme defined as access-token

## Test setup

- Unit tests under [src](src)
- E2E config in [test/jest-e2e.json](test/jest-e2e.json)
- Existing tests are partially outdated and do not align with current controller/service method names in multiple files

# 8. Code quality and architecture findings

## Duplicated or overlapping responsibilities

- Two parallel auth paths:
  - AuthService path issues JWT and uses argon2
  - SimpleAuthService path uses bcrypt and returns only user info (no tokens)
- User/admin/profile logic is bundled into same service boundary as auth core

## Coupling between auth and profile logic

- User profile fields and admin policy are in User model and managed in same service
- Avatar upload storage integration is directly in users flow, tightly coupling media concerns

## Custom mechanisms with risk/maintenance cost

- Custom JwtAuthGuard exists but is not applied to sensitive routes
- OAuth strategies exist but providers are commented out in module, creating confusing partial behavior
- Refresh token in request body rather than standardized cookie/session security pattern

## Clean/reusable areas

- PrismaService centralized and simple
- TokensService encapsulates signing/verifying logic with issuer/audience enforcement
- OtpService encapsulates OTP generation/verification and cooldown logic cleanly
- Consistent DTO usage and global ValidationPipe are present

## Technical debt

- Stale tests with outdated method names and behavior expectations
- README describes routes/models that differ from actual implementation naming
- Env naming inconsistency (JWT_ISS/JWT_AUD vs JWT_ISSUER/JWT_AUDIENCE in tests/docs)
- No authorization layer on admin/profile endpoints
- OAuth likely non-operational due strategy registration disabled

## Blockers for migrating to Supabase

- Core identity model is customized and mixed with app profile fields
- Session/token strategy is custom RS256 + DB session hashing, not aligned by default with Supabase Auth flows
- Multiple auth paradigms (email auth + simple username auth + OAuth partial) increase migration complexity
- Missing clear separation between:
  - auth core
  - user profile domain
  - admin domain

# 9. Classification for future remake

## 1) Keep as-is

- [src/prisma.service.ts](src/prisma.service.ts): minimal, clean DB lifecycle wrapper
- [src/prisma.module.ts](src/prisma.module.ts): straightforward DI module
- [src/common/filters/auth-exception.filter.ts](src/common/filters/auth-exception.filter.ts): useful global error normalization base (may need refinement)
- [src/jwks/jwks.controller.ts](src/jwks/jwks.controller.ts): good concept for inter-service key distribution

## 2) Refactor and keep

- [src/auth/tokens.service.ts](src/auth/tokens.service.ts): keep abstraction, refactor env handling/validation and naming consistency
- [src/auth/otp.service.ts](src/auth/otp.service.ts): keep core, add attempts/rate-limit hardening and enum constraints
- [src/auth/auth.service.ts](src/auth/auth.service.ts): keep business flow intent, split into focused use-case services and normalize password hashing strategy
- [src/users/users.service.ts](src/users/users.service.ts): keep profile/admin operations but move out of auth boundary in remake architecture
- [prisma/schema.prisma](prisma/schema.prisma): keep broad entities, but split auth-core vs profile/admin concerns

## 3) Remove / deprecate

- [src/auth/simple-auth.controller.ts](src/auth/simple-auth.controller.ts) and [src/auth/simple-auth.service.ts](src/auth/simple-auth.service.ts): deprecate or fully integrate; current parallel login model is inconsistent with token architecture
- Unused/unapplied [src/common/guards/jwt-auth.guard.ts](src/common/guards/jwt-auth.guard.ts) if final design uses Passport guard strategy instead
- Stale tests that no longer match implementation:
  - [src/auth/auth.controller.spec.ts](src/auth/auth.controller.spec.ts)
  - [src/auth/auth.service.spec.ts](src/auth/auth.service.spec.ts)
  - [src/auth/tokens.service.spec.ts](src/auth/tokens.service.spec.ts)
  - [src/health.controller.spec.ts](src/health.controller.spec.ts)
  - [src/jwks/jwks.controller.spec.ts](src/jwks/jwks.controller.spec.ts)
  - [test/app.e2e-spec.ts](test/app.e2e-spec.ts)

# 10. Final recommendation

## Summary of current system

Current service is a workable NestJS auth backend with OTP register/reset, JWT access+refresh session rotation, OAuth model scaffolding, JWKS publishing, and expanded user/admin/profile APIs. The platform currently mixes authentication, identity profile management, admin moderation, and media upload in one service.

## Biggest architectural issues

- Missing authorization enforcement on sensitive profile/admin routes
- Partial OAuth wiring (strategies present but disabled in module providers)
- Parallel simple-auth path creates inconsistent identity behavior
- Domain boundary blur: auth core and profile/admin/media concerns are tightly coupled
- Drift between docs/tests and runtime code creates operational ambiguity

## Likely remake direction (high level only)

- Separate auth core from profile/admin/media domains
- Adopt one canonical identity and credential model
- Standardize token/session strategy and env contracts
- Introduce clear authorization layer (guards + role policies)
- Treat OAuth as either fully supported and tested or explicitly removed
- If moving toward Supabase, keep this service focused on platform-specific authorization and user domain orchestration rather than re-implementing generic identity primitives
