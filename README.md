# Pyin Nyar Backend 👋

NestJS + Prisma (PostgreSQL) API for the Pyin Nyar app — auth (OTP + JWT sessions), email via Resend, and curriculum/quiz/tutor models.

## Tech stack

- [NestJS](https://nestjs.com) 12 + TypeScript (ESM)
- [Prisma](https://www.prisma.io) 7 + PostgreSQL (`prisma/schema.prisma`)
- Auth: `argon2` password hashing, JWT access/refresh tokens, OTP email challenges, revocable sessions
- Email: [Resend](https://resend.com)
- Tests: [Vitest](https://vitest.dev) (unit + e2e via supertest)
- Lint: `oxlint`, format: `prettier`

## Prerequisites

- Node.js 22+ (`node --version` — tested on v26)
- pnpm 10+ (`pnpm --version` — tested on 12.6)
- PostgreSQL 14+ running locally (or a `DATABASE_URL` to a hosted DB)

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Set up environment

   ```bash
   cp .env.example .env
   ```

   Required keys (see `.env.example`):

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/pyin-nyar
   PORT=3000
   NODE_ENV=development
   JWT_ACCESS_SECRET=change-me
   JWT_REFRESH_SECRET=change-me
   JWT_ACCESS_TTL=900 # seconds (15m)
   JWT_REFRESH_TTL=1209600 # seconds (14d)
   OTP_PEPPER=change-me
   RESEND_API_KEY=
   ```

3. Set up the database

   ```bash
   pnpm dlx prisma migrate dev
   pnpm dlx prisma generate
   ```

4. Start the app

   ```bash
   pnpm run dev        # watch mode (same as start:dev)
   ```

   API: `http://localhost:3000` — Swagger docs at `http://localhost:3000/api`

## Scripts

```bash
pnpm run dev          # nest start --watch
pnpm run build        # nest build
pnpm run start:prod   # node dist/main
pnpm run start:debug  # nest start --debug --watch
pnpm run lint         # oxlint --type-aware src/ test/
pnpm run format       # prettier --write "src/**/*.ts" "test/**/*.ts"
pnpm run test         # vitest run (unit)
pnpm run test:watch   # vitest (watch)
pnpm run test:cov     # vitest run --coverage
pnpm run test:e2e     # vitest --config ./vitest.config.e2e.ts
```

## API overview

Swagger: `/api`

| Method | Route               | Description                              |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/`                 | Health check (`AppController`)           |
| GET    | `/auth/me`          | Current user (Bearer access token)       |
| POST   | `/auth/otp/request` | Request email OTP (`{ email, purpose }`) |
| POST   | `/auth/sign-up`     | Sign up with OTP + password              |
| POST   | `/auth/login`       | Login with email + password              |
| POST   | `/auth/refresh`     | Rotate refresh token                     |
| POST   | `/auth/logout`      | Revoke one refresh token                 |
| POST   | `/auth/logout-all`  | Revoke all sessions for current user     |

Global `ValidationPipe` with `transform + whitelist`. Protected routes use `AuthGuard` (Bearer access token) + `@CurrentUser()` in `src/auth/decorators/`. `GET /auth/me` and `POST /auth/logout-all` require `Authorization: Bearer <accessToken>`.

Password rule on sign-up: min 6 chars, must include a number and a special symbol.

## Project structure

```
src/
  main.ts            # bootstrap, ValidationPipe, Swagger (/api)
  app.module.ts      # ConfigModule, Prisma, Email, Auth
  auth/              # controller, service, otp.service, token.service, dto/, decorators/
  email/             # Resend EmailService
  prisma/            # PrismaModule + PrismaService
  generated/prisma/  # generated client (git-ignored, run prisma generate)
prisma/
  schema.prisma      # User, Profile, Session, OtpChallenge, Subject/Chapter/Lesson,
                     # Conversation/Message, Upload, Quiz/Question/Attempt/Answer,
                     # MasteryScore, StudyPlan, UsageLog
  migrations/
test/                # e2e specs (vitest + supertest)
```

Prisma 7 config: `prisma7.config.ts` (loads `.env` via `dotenv/config`).

## Learn more

- [NestJS documentation](https://docs.nestjs.com)
- [Prisma documentation](https://www.prisma.io/docs)
- [Expo mobile app](../pyin-nyar/README.md) — the React Native client for this API
