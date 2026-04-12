# BrainBattle Auth - Architecture Report

## 1. Project Overview

### Purpose of the project

`brainbattle-auth` is an authentication and identity service for the BrainBattle platform. In the current codebase, it is not a full custom auth server; it is a Supabase-backed identity/profile API that:

- Accepts and validates Supabase access tokens.
- Exposes the current authenticated user through a lightweight auth context layer.
- Reads and updates user-related data stored in public tables such as profile, learner profile, roles, settings, and wallet links.
- Provides an admin surface for viewing users and changing status/roles.

The service is therefore an identity companion around Supabase Auth rather than an independent auth provider.

### Tech stack

- **NestJS 11** for the HTTP API, DI container, guards, controllers, and validation pipeline.
- **Prisma 6** as the ORM and database client.
- **PostgreSQL** as the backing database.
- **Supabase Auth** as the source of truth for bearer-token authentication and the `auth.users` schema.
- **class-validator** and **class-transformer** for DTO validation and request transformation.
- **Swagger** for OpenAPI documentation.
- **Docker** and **Docker Compose** for local runtime and container packaging.

The package manifest also includes Passport, JWT, bcrypt, argon2, nodemailer, and the AWS S3 SDK, but those dependencies are not meaningfully used in the current source tree.

### High-level architecture

The project uses a modular NestJS structure with a thin auth context layer:

1. The client sends a Supabase access token in `Authorization: Bearer ...`.
2. `SupabaseAuthGuard` verifies the token using the Supabase client.
3. The guard attaches a minimal current-user object to the request.
4. Controllers use `CurrentUserDecorator` to retrieve the request user.
5. Feature services query Prisma directly against the `auth` and `public` schemas.
6. Responses are returned from controllers without a separate domain layer, repository layer, or use-case layer.

This is a pragmatic modular monolith, but it is not clean architecture yet. Persistence, authorization, and business logic are still tightly coupled.

## 2. Folder Structure

### Full folder tree

```text
brainbattle-auth/
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── README.md
├── tsconfig.build.json
├── tsconfig.json
├── .env.example
├── docs/
│   └── current-auth-audit.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20251025140158_init/
│       │   └── migration.sql
│       ├── 20251025141810_add_session/
│       │   └── migration.sql
│       ├── 20251025151014_add_email_otp/
│       │   └── migration.sql
│       ├── 20251025171309_add_oauth_accounts/
│       │   └── migration.sql
│       ├── 20260115125332_add_username_profile_admin_fields/
│       │   └── migration.sql
│       └── 20260115130018_make_username_password_optional/
│           └── migration.sql
├── scripts/
├── src/
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── main.ts
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   ├── admin-users/
│   │   ├── admin-users.controller.ts
│   │   ├── admin-users.module.ts
│   │   ├── admin-users.service.ts
│   │   └── dto/
│   │       ├── update-user-roles.dto.ts
│   │       └── update-user-status.dto.ts
│   ├── auth-context/
│   │   ├── auth-context.module.ts
│   │   ├── auth.controller.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   └── supabase-auth.guard.ts
│   │   ├── interfaces/
│   │   │   └── current-user.interface.ts
│   │   └── services/
│   │       └── supabase-auth.service.ts
│   ├── common/
│   │   └── filters/
│   │       └── auth-exception.filter.ts
│   ├── config/
│   │   └── env.ts
│   ├── learner-profiles/
│   │   ├── learner-profiles.controller.ts
│   │   ├── learner-profiles.module.ts
│   │   ├── learner-profiles.service.ts
│   │   └── dto/
│   │       └── update-learner-profile.dto.ts
│   ├── profiles/
│   │   ├── profiles.controller.ts
│   │   ├── profiles.module.ts
│   │   ├── profiles.service.ts
│   │   └── dto/
│   │       └── update-my-profile.dto.ts
│   ├── roles/
│   │   ├── roles.controller.ts
│   │   ├── roles.module.ts
│   │   └── roles.service.ts
│   └── wallets/
│       ├── wallets.controller.ts
│       ├── wallets.module.ts
│       └── wallets.service.ts
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

### Folder responsibilities

- `prisma/`
  - Owns the database schema, model mappings, and migration history.
  - In this repository it is especially important because the schema introspects Supabase `auth` tables and also defines custom public tables.
  - The schema is the definitive source of the current domain model, but the migration history is not aligned with it.

- `src/admin-users`
  - Admin-only user management.
  - Exposes list/get/update status/update roles operations.
  - Reads from `profiles`, `user_roles`, `learner_profiles`, and `user_settings`.

- `src/auth-context`
  - Authentication and authorization infrastructure for the service.
  - Contains the Supabase token guard, role guard, current-user decorator, and the `/auth/me` endpoint.

- `src/learner-profiles`
  - Learner onboarding and goal-tracking profile logic.
  - Updates a specialized user profile table separate from the general profile table.

- `src/profiles`
  - General profile read/update logic.
  - Manages public-facing user identity data such as username, display name, avatar, and bio.

- `src/common`
  - Shared cross-cutting infrastructure.
  - Currently only contains a global exception filter for auth-related HTTP responses.

- `src/config`
  - Environment variable access.
  - Currently a simple unvalidated object rather than a typed config module.

- `src/roles`
  - Small convenience module for fetching the authenticated user’s role list.

- `src/wallets`
  - Wallet-link listing for the authenticated user.

### Role of controllers, services, DTOs, guards, and decorators

- **Controllers** handle HTTP routing, parameter extraction, and response shaping.
- **Services** contain the actual query logic and basic business rules.
- **DTOs** define and validate incoming request bodies.
- **Guards** control whether a request can enter a controller action.
- **Decorators** provide a compact way to pull request-scoped data, such as the current user, into controller methods.

This codebase uses the standard Nest pattern, but the services still talk directly to Prisma rather than an intermediate repository or application service layer.

## 3. Module Breakdown

### AppModule

**Responsibility**

- Root composition module for the application.
- Wires together Prisma, auth context, profile, learner profile, roles, admin users, and wallet modules.

**Controllers**

- `HealthController`

**Services**

- None directly.

**DTOs**

- None directly.

**Dependencies**

- Depends on `PrismaModule` and all feature modules.

**Interaction with other modules**

- Provides the final assembled runtime tree.
- The way guards are declared in feature controllers means the auth-context module must be available in the Nest DI graph.

### PrismaModule

**Responsibility**

- Global Prisma client provider.
- Manages database connection lifecycle.

**Controllers**

- None.

**Services**

- `PrismaService`

**DTOs**

- None.

**Dependencies**

- Depends on `@prisma/client` and Nest lifecycle hooks.

**Interaction with other modules**

- Exported globally so every feature module can inject `PrismaService` without additional imports.

### AuthContextModule

**Responsibility**

- Provides the authentication and authorization infrastructure for the service.

**Controllers**

- `AuthContextController`

**Services**

- `SupabaseAuthService`

**DTOs**

- None.

**Dependencies**

- Depends on Supabase JS and Prisma indirectly through controllers and guards.

**Interaction with other modules**

- Supplies `SupabaseAuthGuard` and `RolesGuard` to controllers in other feature modules.

### ProfilesModule

**Responsibility**

- Read and update the main profile record for the current user.

**Controllers**

- `ProfilesController`

**Services**

- `ProfilesService`

**DTOs**

- `UpdateMyProfileDto`

**Dependencies**

- Prisma for `profile` table access.
- Supabase auth guard for request authentication.

**Interaction with other modules**

- Relies on the auth-context layer for `CurrentUserDecorator` and the bearer-token guard.

### LearnerProfilesModule

**Responsibility**

- Manages the learner-specific onboarding and learning preference state.

**Controllers**

- `LearnerProfilesController`

**Services**

- `LearnerProfilesService`

**DTOs**

- `UpdateLearnerProfileDto`

**Dependencies**

- Prisma for `learnerProfile` table access.
- Supabase auth guard for request authentication.

**Interaction with other modules**

- Shares the same current-user extraction pattern as `ProfilesModule`.

### RolesModule

**Responsibility**

- Returns the current user’s role list.

**Controllers**

- `RolesController`

**Services**

- `RolesService`

**DTOs**

- None.

**Dependencies**

- Prisma and the auth-context guard.

**Interaction with other modules**

- Useful for clients that need to render UI based on role membership.

### AdminUsersModule

**Responsibility**

- Admin user administration.
- Reads user data and mutates status or roles.

**Controllers**

- `AdminUsersController`

**Services**

- `AdminUsersService`

**DTOs**

- `UpdateUserStatusDto`
- `UpdateUserRolesDto`

**Dependencies**

- Prisma.
- AuthContext guards.

**Interaction with other modules**

- Depends on the same profile/roles/learner profile tables used by the rest of the identity layer.
- Has the strongest authorization requirements in the service.

### WalletsModule

**Responsibility**

- Returns wallet link records for the current user.

**Controllers**

- `WalletsController`

**Services**

- `WalletsService`

**DTOs**

- None.

**Dependencies**

- Prisma.
- AuthContext guard.

**Interaction with other modules**

- Minimal feature module with a single read endpoint.

### Common folder

**Responsibility**

- Houses reusable infrastructure code.

**Current contents**

- `AuthExceptionFilter`

**Role**

- Normalizes HTTP error responses and exposes a fallback 500 response for non-HTTP exceptions.

### Controller / service / DTO / guard / decorator interaction pattern

Example flow:

```text
HTTP request
  → guard checks authorization
  → decorator reads request user
  → controller receives method arguments
  → service performs Prisma query
  → Prisma sends SQL to database
  → controller returns response
```

This pattern is used consistently across the current feature modules.

## 4. Database & Prisma

### Prisma schema overview

The current Prisma schema is a hybrid model:

- It introspects a large portion of Supabase’s `auth` schema.
- It defines custom tables in the `public` schema for product-specific data.

That means Prisma is being used both as:

1. a type-safe query layer for application tables, and
2. a read model for Supabase-auth-managed tables.

### Relationship between the main models

#### AuthUser (`auth.users`)

- Prisma model: `AuthUser`
- Schema: `auth`
- Table: `users`
- Role in the system: the root identity record from Supabase.

`AuthUser` is the anchor for the public extension tables. The code uses `AuthUser.id` as the primary link into app-specific records.

#### Profile

- Prisma model: `Profile`
- Schema: `public`
- Purpose: general profile metadata.
- Relation: one-to-one with `AuthUser` through `Profile.id -> AuthUser.id`.

This model stores fields like:

- `email`
- `username`
- `displayName`
- `avatarUrl`
- `bio`
- `status`

This is the main public-facing profile table used by the service.

#### UserRole

- Prisma model: `UserRole`
- Schema: `public`
- Purpose: many-to-many style role assignment, materialized as one row per user-role pair.
- Relation: many `UserRole` records belong to one `AuthUser`.

The composite primary key `[userId, role]` prevents duplicate role assignments.

#### LearnerProfile

- Prisma model: `LearnerProfile`
- Schema: `public`
- Purpose: learning-specific preferences and onboarding state.
- Relation: one-to-one with `AuthUser` through `userId`.

Fields include goal type, level targets, language preferences, focus/weak skill arrays, and onboarding completion.

#### UserSetting

- Prisma model: `UserSetting`
- Schema: `public`
- Purpose: per-user preferences such as timezone, language, and notification state.
- Relation: one-to-one with `AuthUser`.

This model exists in Prisma schema, but there is no service module for it in the current source tree.

#### WalletLink

- Prisma model: `WalletLink`
- Schema: `public`
- Purpose: stores blockchain wallet associations.
- Relation: many wallet links can belong to one `AuthUser`.

### Cross-schema layout

- `auth` schema
  - Managed by Supabase.
  - Contains `users`, `sessions`, `identities`, and many other internal auth tables.

- `public` schema
  - Managed by this application.
  - Contains `profiles`, `user_roles`, `learner_profiles`, `user_settings`, and `wallet_links`.

This is a clean separation in principle: identity lives in `auth`, domain data lives in `public`. The implementation, however, still has drift between schema, migrations, and service assumptions.

### How Prisma maps to Supabase

Prisma is configured with:

- `provider = "postgresql"`
- `schemas = ["auth", "public"]`

This allows Prisma to query both Supabase’s managed auth tables and the app’s public tables within one client.

Practical implications:

- Prisma does not own the `auth.users` lifecycle; Supabase does.
- The application reads `AuthUser` as a join target and identity source.
- The application owns its public extensions and should be responsible for creating those rows when users are provisioned.

### Prisma design concerns

- The migrations under `prisma/migrations` still reflect the older standalone auth model (`User`, `Session`, `EmailOtp`, `Account`).
- The current schema reflects Supabase-auth-centric tables instead.
- That mismatch makes schema evolution risky and complicates local bootstrap.
- `WalletLink.isPrimary` is not enforced at the database level as a single-primary invariant.
- `UserSetting` is defined but not yet wired into a service or module, which suggests incomplete domain coverage.

## 5. Authentication & Authorization Flow

### Full request lifecycle

```text
HTTP request
  → Nest route matching
  → SupabaseAuthGuard
  → req.user population
  → CurrentUserDecorator
  → Controller method
  → Service method
  → Prisma query
  → PostgreSQL / Supabase-backed database
```

### SupabaseAuthGuard

The guard:

1. Reads the `Authorization` header.
2. Ensures it starts with `Bearer `.
3. Extracts the token.
4. Sends the token to `SupabaseAuthService.verifyAccessToken`.
5. On success, stores the returned user object on `req.user`.
6. On failure, throws `UnauthorizedException`.

This is a simple and appropriate guard for a Supabase token validation model.

### CurrentUser decorator

The decorator is a request parameter helper:

- It reads `req.user` from the HTTP execution context.
- It returns a typed `CurrentUser` object.
- Controllers use it so they do not need to manually access the request object.

This is a standard NestJS pattern and keeps controllers small.

### roles.guard

`RolesGuard` is a metadata-driven authorization guard:

1. `@Roles(...)` stores required roles as metadata on the method or class.
2. `RolesGuard` resolves the metadata via `Reflector`.
3. It reads `req.user.id`.
4. It loads the user’s role rows from Prisma.
5. It grants access if at least one required role matches at least one assigned role.

This is a straightforward role-based access control implementation. The main limitation is that it works only when the auth guard has already run and populated `req.user`.

### Security model

The current system is token verification plus database role lookup. It does not use session cookies or server-side access-token issuance. That is fine for a stateless API gateway style service, but it means the security model is entirely dependent on Supabase token validity and correct role rows in the app database.

## 6. Data Flow Example

### Example: `GET /auth/me`

Step-by-step flow:

1. The client sends:

```http
GET /auth/me
Authorization: Bearer <supabase-access-token>
```

2. `SupabaseAuthGuard` runs before the controller.
3. The guard calls Supabase to validate the token.
4. If Supabase rejects the token, the request fails with `401 Unauthorized`.
5. If Supabase accepts the token, the guard places the Supabase user object in `req.user`.
6. The controller receives the user via `@CurrentUserDecorator()`.
7. `AuthContextController.me()` calls Prisma:
   - `profile.findUnique({ where: { id: user.id }, include: ... })`
8. Prisma reads the public `profiles` table and joins:
   - `user.roles`
   - `user.learnerProfile`
9. The controller shapes a response containing:
   - `user_id`
   - `email`
   - role list
   - profile summary
   - learner profile object
10. The response is returned to the client.

### Why this flow matters

`GET /auth/me` is the clearest example of the whole architecture:

- Supabase is responsible for identity verification.
- Prisma is responsible for app-owned profile state.
- The controller merges the two into a consumer-friendly response.

## 7. Issues & Problems

### Prisma mismatch issues

- The live schema and migration history do not describe the same domain model.
- The migrations build the older standalone auth design, while the current schema introspects Supabase `auth.users` plus public profile tables.
- This is one of the highest-risk problems in the repository.

### Missing provisioning paths

- `ProfilesService.updateMe()` assumes a profile already exists.
- `LearnerProfilesService.updateMe()` assumes a learner profile already exists.
- `LearnerProfilesService.completeOnboarding()` assumes the row already exists.
- No create/upsert provisioning path was found in the current code.

### Code smells

- The repository mixes identity, profile, admin, and wallet concerns in one service boundary.
- `UserSetting` exists in Prisma but has no service/module.
- `RolesModule` is only a read helper, but role enforcement logic is elsewhere in a separate guard.
- `AuthExceptionFilter` exists, but most error handling still relies on Nest defaults and manual throws.

### Security risks

- Admin endpoints are the highest-risk surface and depend entirely on the correctness of `RolesGuard` plus the module DI wiring.
- `WalletLink.isPrimary` is not protected against multiple primaries.
- Username uniqueness is checked in application logic before update, which is race-prone unless the database constraint is the final arbiter.
- The config layer is not validated at startup, so a missing or malformed Supabase key can fail only at runtime.

### Consistency issues in service logic

- `ProfilesController` and `AuthContextController` both read profile data, but they shape responses differently.
- `AdminUsersService` returns raw Prisma objects rather than a dedicated DTO or view model.
- `UpdateLearnerProfileDto` accepts arrays but does not validate array item types.
- `AuthContextController` returns `profile` only if the profile row exists, but the identity record may still be valid independently.

## 8. Architecture Evaluation

### Is it scalable?

Moderately scalable for a small team and a bounded identity service, but not ideal for long-term growth.

What scales well:

- Feature-based folder separation.
- Simple global Prisma service.
- Token validation isolated in a service/guard.

What does not scale well:

- Direct Prisma usage everywhere.
- No repository abstraction.
- No use-case/application layer.
- No explicit user provisioning workflow.
- Schema drift between migrations and the live data model.

### Does it follow good NestJS practices?

Partially.

Good practices present:

- Clear controller/service split.
- DTO validation with `class-validator`.
- Global validation pipe.
- Guards and custom decorators.
- Feature modules.

Weaknesses relative to stronger NestJS practice:

- Guards are used without a clearly global or consistently imported auth-context module.
- Services are too close to persistence.
- Shared business rules are not centralized.
- The service lacks a formal config module.

### Separation of concerns quality

The separation is acceptable at a basic NestJS level, but not at a clean-architecture level.

- Presentation concerns: mostly isolated in controllers.
- Auth concerns: separated into auth-context.
- Persistence concerns: still embedded directly inside feature services.
- Domain concerns: spread across service methods and Prisma schema.

## 9. Recommendations

### Folder structure

- Keep feature folders, but add a clearer layering inside each one:
  - `presentation`
  - `application`
  - `domain`
  - `infrastructure`
- Move shared auth helpers into a `shared/auth` or `core/auth` area.
- Add a `shared/config` module with validation.

### Prisma usage

- Use upsert/provisioning for one-to-one extension tables such as `profiles`, `learner_profiles`, and `user_settings`.
- Add transaction boundaries for multi-step writes like role replacement.
- Add database-level constraints or partial indexes where business rules matter, especially for `isPrimary` wallet links.
- Decide whether the schema should be fully Supabase-managed or application-managed and remove the old migration history accordingly.

### Auth system

- Keep Supabase as the identity source if that is the product decision.
- Add a dedicated provisioning hook for new users so app tables are created consistently.
- Make the `CurrentUser` contract explicit and stable.
- Define whether role checks should be additive or restrictive and test that behavior.
- If admin access must be robust, add auditing for role/status changes.

### Module boundaries

- Import the auth-context module wherever its guards are used, or make it global if that is intentional.
- Separate admin user management from general identity/profile handling.
- Add a dedicated settings module if `UserSetting` is real product functionality.
- Move wallet logic into a proper bounded context if wallet linking becomes important beyond a simple read endpoint.

## 10. Suggested Refactor

### Cleaner architecture version

The production-grade structure should separate HTTP, application logic, domain rules, and database access.

Example structure:

```text
src/
├── shared/
│   ├── auth/
│   │   ├── supabase-auth.guard.ts
│   │   ├── current-user.decorator.ts
│   │   └── roles.guard.ts
│   ├── config/
│   └── prisma/
├── modules/
│   ├── identity/
│   │   ├── presentation/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   ├── learner-onboarding/
│   ├── admin/
│   ├── roles/
│   └── wallets/
└── app.module.ts
```

### Improved module structure

- **Presentation layer**
  - Controllers, DTOs, HTTP-specific response shaping.

- **Application layer**
  - Use cases such as `GetMyProfile`, `UpdateMyProfile`, `CompleteOnboarding`, `ReplaceUserRoles`.

- **Domain layer**
  - Business rules and invariants, such as allowed statuses, primary wallet constraints, and role policies.

- **Infrastructure layer**
  - Prisma repositories, Supabase token verification, and any external integrations.

### Production best practices

- Validate environment variables at startup.
- Add tests for guard behavior, role checks, and provisioning logic.
- Make all one-to-one extension tables provisioned atomically.
- Return DTO-shaped responses rather than raw Prisma objects for public APIs.
- Keep schema and migrations aligned; regenerate or rebaseline if the database model has changed direction.
- Add error translation for Prisma unique violations and missing-record updates.
- Add audit logging for admin operations.

### Bottom line

The current implementation is a workable Supabase-backed identity API, but it is not yet production-hardened as a long-lived backend boundary. The most important improvements are:

1. align Prisma schema, migrations, and runtime behavior,
2. make provisioning explicit for profile extension tables,
3. formalize the auth-context module wiring,
4. introduce a stronger service layering model,
5. add tests around security-sensitive behavior.
