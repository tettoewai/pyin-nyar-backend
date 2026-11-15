# Pyin Nyar — Production Plan

**Status:** Draft v1.2 · **Created:** 2026-10-30 · **Revised:** 2026-11-15 (Phase 0 defects D1–D4, D7, D12–D13 closed) · **Owner:** TBD
**Scope:** Three codebases (`pyin-nyar/` mobile, `pyin-nyar-backend/`, `pyin-nyar-admin/`) from the current commit state to a public store launch and a stable post-launch operating mode.

**How to use this document**

**Product source of truth:** [`FEATURE-SPEC.md`](./FEATURE-SPEC.md) — feature list, MVP must/should/later split, user journeys, and success metrics. This plan assigns those features to phases and tracks their status; [Appendix E](#appendix-e--feature-traceability-spec--plan) is the mapping table, including every place the two documents disagree.

- Phases are sequential for the critical path, but workstreams inside a phase run in parallel.
- Every task has an owner column (`BE`, `MOB`, `ADM`, `CONTENT`, `OPS`) and an acceptance criterion. A task is not done until its acceptance criterion is demonstrably true in staging.
- Numbers in `Est.` are **solo full-time developer-days**. Multiply by ~1.5 for part-time, divide by ~1.8 for two developers working in parallel with content help.
- Anything marked **⚠ Decision** must be resolved before the phase that depends on it starts. Recommendations are provided so work is never blocked on an answer.
- This plan deliberately excludes features that do not strengthen the core loop. See [§20 Post-v1](#20-post-v1-roadmap).

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Current state (verified)](#2-current-state-verified)
3. [Definition of production](#3-definition-of-production)
4. [Target architecture](#4-target-architecture)
5. [Data model changes](#5-data-model-changes)
6. [Target API surface (v1)](#6-target-api-surface-v1)
7. [AI layer design](#7-ai-layer-design)
8. [Phase 0 — Foundations & blockers](#8-phase-0--foundations--blockers)
9. [Phase 1 — Curriculum ingestion & onboarding](#9-phase-1--curriculum-ingestion--onboarding)
10. [Phase 2 — AI Tutor + Teach Me](#10-phase-2--ai-tutor--teach-me)
11. [Phase 3 — Upload, OCR, photo tutor](#11-phase-3--upload-ocr-photo-tutor)
12. [Phase 4 — Quizzes, attempts, grading](#12-phase-4--quizzes-attempts-grading)
13. [Phase 5 — Mastery, weakness, study plans](#13-phase-5--mastery-weakness-study-plans)
14. [Phase 6 — Mobile integration](#14-phase-6--mobile-integration)
15. [Phase 7 — Gamification & progress](#15-phase-7--gamification--progress)
16. [Phase 8 — Admin application](#16-phase-8--admin-application)
17. [Phase 9 — Hardening & compliance](#17-phase-9--hardening--compliance)
18. [Phase 10 — Staging, beta, launch](#18-phase-10--staging-beta-launch)
19. [Security & compliance](#19-security--compliance)
20. [Post-v1 roadmap](#20-post-v1-roadmap)
21. [Testing & AI evaluation](#21-testing--ai-evaluation)
22. [Observability](#22-observability)
23. [Infrastructure & environments](#23-infrastructure--environments)
24. [CI/CD & release engineering](#24-cicd--release-engineering)
25. [Timeline & milestones](#25-timeline--milestones)
26. [Launch checklist](#26-launch-checklist)
27. [Risks & mitigations](#27-risks--mitigations)
28. [Open decisions](#28-open-decisions)

---

## 1. Executive summary

The product thesis is correct and the data model was built for it. What exists today is a **production-shaped identity + KYC + curriculum-shell backend** and a **polished mobile demo**. The learning loop — `content → tutor → practice → assessment → weakness detection → recommendation → repeat` — is not functional end to end.

**The plan in one paragraph:** Spend two weeks fixing the correctness and security bugs that would poison every feature built on top of them, and add the missing curriculum read/write surface. Then ingest the new Grade 12 corpus into the curriculum model, and build four vertical slices in this order: **AI tutor + Teach Me → photo homework → quiz/attempt/grading → mastery/study plan**. Each slice ships backend, mobile UI, and tests together, and each slice must work against published curriculum content before the next starts. Admin, hardening, observability, and release engineering are built alongside, not bolted on at the end. Voice, a dedicated English tutor, parents, and classrooms are explicitly deferred.

**New input (2026-10-30):** five Grade 12 textbook bundles are now in the workspace root (`curriculum/`) — full markdown transcripts, a TOC/page map, and extracted page images for Myanmar, English, Maths, Physics, and Chemistry. Three are substantially complete (Myanmar, English, Maths); Physics is **table-of-contents only**; Chemistry is **partial (pp. 20–40)**. This removes the "author the curriculum outline" work and gives the AI real grounding material, but it adds a content ingestion/QA pipeline and makes the **licensing question urgent** (the books carry a Ministry copyright notice). See [§2.5](#25-curriculum-corpus-added-2026-10-30) for the inventory and [§9](#9-phase-1--curriculum-ingestion--onboarding) for the revised phase.

**Timeline (solo, full-time):** 20 weeks to public launch, 22 with contingency. Two developers plus a content editor: 12–14 weeks. Part-time solo: 30–34 weeks. Start date assumed **2026-11-02**, so target launch **2027-03-22**, with a two-week buffer. This is **later than the March matric exam window**; if that window is a hard requirement, use the reduced "exam sprint" scope in [§25](#25-timeline--milestones) instead of the full launch set.

**The three things most likely to sink the launch** (details in [§27](#27-risks--mitigations)):

1. **Curriculum licensing and completeness.** The corpus gives structure and (for three subjects) bodies, but the textbooks are copyrighted by the Ministry of Education, Physics has no body text, and Chemistry covers only 21 pages. The app cannot ship "Myanmar curriculum support" without either permission to use the text or a rewritten, original body that follows the official scope.
2. **Burmese-language and math fidelity.** Tutor output quality, handwritten Burmese/English OCR, and rendering of ~1,100 LaTeX math blocks are all unproven. Each needs an explicit eval set from week 3, not a launch-week surprise.
3. **AI unit economics on a Myanmar price point.** Token cost per active student must be measured from week 5 and capped by quota before any public launch.

---

## 2. Current state (verified)

### 2.1 Repository reality

| Project                      | Stack                                                                                                              | Git                                                                  | State                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pyin-nyar/`                 | Expo SDK 58, RN 0.88, React 19.3, Expo Router, Gluestack UI, UniWind, React Query, SecureStore, Google Sign-In     | own repo, `main`                                                     | Working tree has only `package.json` / lockfile modified. Screens exist; almost all data is hardcoded.                                                                     |
| `pyin-nyar-backend/`         | NestJS 12 (ESM), Prisma 7 + PostgreSQL, JWT access/refresh sessions, OTP, Resend, Swagger, pino, throttler, Vitest | own repo, `main`                                                     | Substantial **uncommitted** work: `common/crypto.*`, `profile/*` added; `kyc/crypto.service.ts` deleted; many modules modified. Only auth, KYC, subject, profile are real. |
| `pyin-nyar-admin/`           | Vite 8, React 19, Tailwind v4, shadcn/Base UI, React Router 8, React Query                                         | **no git repo**                                                      | Placeholder (`App.tsx` is a template button).                                                                                                                              |
| `curriculum/1..5_G12 … GMS/` | GMS extraction bundles: markdown, `_meta.json` (TOC + page stats), inline page images                              | **not in git** (untracked workspace root, beside the three projects) | Grade 12 corpus. 3 of 5 subjects substantially complete; Physics is TOC-only; Chemistry is partial. See §2.5.                                                              |

There is no root workspace, no root README, no root CI, and no shared API types. The corpus is ~14 MB of untracked source material sitting next to the three projects; it needs a home, a manifest, and a licence decision before ingestion.

### 2.2 What actually works

| Area                                                                                 | Evidence                                                       | Assessment                                                                           |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Auth: OTP signup, password login, Google login, refresh rotation, logout, logout-all | `src/auth/*`, `Session`, `OtpChallenge`                        | Production-shaped; D1/D2 closed (2026-11-15)                                         |
| KYC submit/read/update + admin review                                                | `src/student-kyc`, `src/kyc`, encrypted PII + HMAC blind index | Works; D4 closed (2026-11-15)                                                        |
| Subject, chapter and lesson CRUD (admin) + public reads                              | `src/subject`                                                  | Works; lesson content still null                                                     |
| Quiz admin list/create                                                               | `src/quiz`                                                     | Partial; no generation, attempts or grading                                          |
| Profile read                                                                         | `src/profile`                                                  | Works: safe projection + lazy `Profile` row; no write path (D3/D7 closed 2026-11-15) |
| Health, Swagger, pino, throttling, global validation                                 | `src/app.controller.ts`, `src/main.ts`                         | Works; no CORS, no prefix, no helmet (D8)                                            |
| Mobile auth/session/refresh                                                          | `src/lib/api.ts`, `src/hooks/auth.ts`                          | Works: single-flight refresh on 401; cached session dropped on any auth failure      |
| Mobile screens                                                                       | 12 route files under `src/app/`                                | Visually complete, data is fake                                                      |

### 2.3 What does not exist

| Capability                                                | Status                                       | Evidence                                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Chapter/Lesson endpoints                                  | **Built**                                    | `src/subject` admin CRUD + public reads (`/curriculum`, `/subject`, `/lesson`); no page/asset provenance yet               |
| Curriculum seed / lesson content                          | **Source material exists, pipeline missing** | G12 corpus in the workspace root (`curriculum/`); `Lesson.content` is always null; no importer, no assets, no publish flow |
| Conversation/message runtime                              | **Missing**                                  | DTOs only                                                                                                                  |
| LLM provider, prompts, streaming, token accounting, quota | **Missing**                                  | No SDK dependency anywhere                                                                                                 |
| File storage, upload endpoint, OCR                        | **Missing**                                  | `Upload` model + DTO only                                                                                                  |
| Quiz generation, attempts, grading                        | **Missing**                                  | Models + DTOs only                                                                                                         |
| Mastery computation, weakness list, study plans           | **Missing**                                  | `MasteryScore` model only                                                                                                  |
| Gamification persistence                                  | **Missing**                                  | UI constants; `Profile.dailyGoalXp` never written                                                                          |
| Admin app                                                 | **Missing**                                  | Placeholder                                                                                                                |
| Onboarding by role                                        | **Missing**                                  | Everyone is `STUDENT`                                                                                                      |
| CI, Dockerfile, deployment config                         | **Missing**                                  | None in any repo                                                                                                           |
| Tests                                                     | **Unit green; e2e unverified**               | 35 unit tests pass; `test/app.e2e-spec.ts` now asserts health JSON, but needs a live Postgres                              |

### 2.4 Confirmed defects (must be fixed first)

| #   | Severity     | Defect                                                                                                                                                                                                                | Location                                    | Status                                                                                               |
| --- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D1  | **Critical** | Class-level `@Public()` on `AuthController` makes the global `AuthGuard` skip `GET /auth/me` and `POST /auth/logout-all`. `@CurrentUser()` is `undefined`, `user.sub` throws → 500.                                   | `auth.controller.ts:26`                     | **Fixed** — method-level `@Public()` only; `/me` guarded                                             |
| D2  | **Critical** | `AuthGuard` catches **all** failures and rethrows `ForbiddenException` → 403. Mobile only refreshes on 401 → expired sessions never recover.                                                                          | `auth.guard.ts:47-52`, mobile `lib/api.ts`  | **Fixed** — 401 for every auth failure; 403 only from `RolesGuard`; mobile clears the session on 401 |
| D3  | **High**     | `GET /profile` returns the raw Prisma user including `passwordHash`.                                                                                                                                                  | `profile.service.ts:8-11`                   | **Fixed** — projection omits `passwordHash` at the query level                                       |
| D4  | **High**     | Preferred-subject contract mismatch: `create` matches `Subject.code`, `update` matches `Subject.id`.                                                                                                                  | `student-kyc.service.ts:27-32` vs `106-115` | **Fixed** — both paths resolve `id`; DTO field renamed `preferredSubjectIds`                         |
| D5  | **High**     | `MasteryScore @@unique([userId, lessonId])` does not dedupe subject/chapter rows because `lessonId` is nullable (Postgres NULL semantics).                                                                            | `schema.prisma:407`                         | Open                                                                                                 |
| D6  | **Medium**   | `Subject @@unique([name, code, grade])` with nullable `code`/`grade` allows duplicates.                                                                                                                               | `schema.prisma:218`                         | Open                                                                                                 |
| D7  | **Medium**   | No `Profile` row is created at signup or Google login.                                                                                                                                                                | `auth.service.ts`                           | **Fixed** — nested create on signup/Google, lazy upsert on `GET /profile`                            |
| D8  | **Medium**   | No CORS, no global `/v1` prefix, no helmet, no body-size limit.                                                                                                                                                       | `main.ts`                                   | Open                                                                                                 |
| D9  | **Medium**   | Backend `.env.example` missing `GOOGLE_WEB/IOS/ANDROID_CLIENT_ID`, `JWT_RESET_SECRET`, `JWT_RESET_TTL`, `KYC_ENCRYPTION_KEY`, `KYC_INDEX_KEY`, `RESEND_API_KEY`. Mobile `.env.example` missing `EXPO_PUBLIC_API_URL`. | env examples                                | Open                                                                                                 |
| D10 | **Medium**   | `EmailService` throws at construction if `RESEND_API_KEY` is absent → app cannot boot in dev without it.                                                                                                              | `email/email.service.ts:13`                 | Open                                                                                                 |
| D11 | **Medium**   | `OtpService` logs OTP codes when not production. Must be impossible to enable in prod.                                                                                                                                | `otp.service.ts`                            | Open                                                                                                 |
| D12 | **Low**      | Stale e2e test.                                                                                                                                                                                                       | `test/app.e2e-spec.ts`                      | **Fixed** — asserts the health payload                                                               |
| D13 | **Low**      | Roles guard returns `false` → 403 correctly, but is not applied anywhere; `@Roles()` is unused.                                                                                                                       | `role.guard.ts`                             | **Fixed** — throws `ForbiddenException`, registered globally, applied on all admin controllers       |

### 2.5 Curriculum corpus added (2026-10-30)

Five Grade 12 source bundles now sit at the repository root. Each was produced by a GMS extraction pipeline (Surya OCR, plus PDF text for English) and contains:

- `<bundle>.md` — the full markdown transcript with inline image references (`_page_N_Type_M.jpeg`);
- `<bundle>_meta.json` — `table_of_contents[]` (`title`, `page_id`, `polygon`), `page_stats[]` (block counts per page), and `debug_data_path`;
- extracted page images (JPEG/SVG).

| Bundle                           | Pages in meta | Markdown | Words  | Headings | Images | Math               | Completeness                                               |
| -------------------------------- | ------------- | -------- | ------ | -------- | ------ | ------------------ | ---------------------------------------------------------- |
| `1_G12 Myanmar Textbook GMS`     | 155           | 726 KB   | ~18.6k | 85       | 16     | 0                  | **Full body**; Burmese section structure                   |
| `2_G12 English Textbook GMS`     | 151           | 311 KB   | ~48.5k | 434      | 101    | 0                  | **Full**: 12 units + 4 reviews + 4 poems                   |
| `3_G12 Mathematics Textbook GMS` | 220           | 289 KB   | ~51.9k | 271      | 194    | ~1,034 `$$` blocks | **Full**: 11 chapters; LaTeX-heavy                         |
| `4_G12 Physics Textbook GMS`     | 6             | 10 KB    | ~950   | 4        | 1      | 0                  | **TOC only** — 13 chapters / 249 pp of headings, no bodies |
| `5_G12 Chemistry Textbook GMS`   | 21            | 52 KB    | ~7.7k  | 30       | 16     | ~71 `$$` blocks    | **Partial** — pp. 20–40 only, starts at §1.5               |

Total ≈ 14 MB. Content quality findings that directly shape the ingestion work:

1. **Physics is not usable as content.** Its markdown is front matter plus the full contents table; the 249-page body is absent. Use the TOC as the authoritative chapter/lesson outline and author bodies separately (or re-extract).
2. **Chemistry is incomplete.** It begins at §1.5, covers §1.5–§2.3 (pages 20–40), and stops mid-§2.3. Chapters 1.1–1.4 and everything after §2.3 are missing.
3. **Broken image references:** 9 empty `![]()` in Chemistry, 1 in Maths, 0 in the others. The importer must reject or placeholder these rather than emit dead links.
4. **No page markers in markdown.** Page mapping must be reconstructed from `meta.table_of_contents[].page_id` and heading order, then stored as `pageStart`/`pageEnd` for citations.
5. **Heading noise.** English repeats `# UNIT 1` (section opener and title), Maths uses `#### Example 1.` / `#### Solution` as headings, and Chemistry promotes `Q 1 to Q 4` to headings. Naive heading splitting will produce hundreds of fake "lessons"; the importer needs a normalization + classification pass.
6. **Math fidelity.** ~1,100 `$$` blocks in Maths and Chemistry plus `<sub>` tags. These must survive import and render on mobile, or the most valuable subject is unusable.
7. **Licensing.** All five books carry a Ministry of Education / Basic Education Curriculum and Textbook Committee copyright notice. Publicly serving the text requires written permission; absent that, the corpus is reference material for scope and evaluation, and lesson bodies must be rewritten. See `D-CURRICULUM` in [§28](#28-open-decisions).

**Plan impact**

| Before corpus                                                   | After corpus                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Author subject/chapter/lesson outlines from scratch (~5–8 days) | Structure comes from the TOC; validation and cleanup instead (~2 days)                        |
| Author 100% of lesson bodies (weeks)                            | Bodies exist for Maths/English/Myanmar (subject to licence); Physics/Chemistry need authoring |
| No grounding material for the tutor or evals                    | Real lesson text, exercises, and page numbers for retrieval and a corpus-derived eval set     |
| No assets                                                       | ~330 images to host, attribute, and render                                                    |
| —                                                               | **New:** importer, asset pipeline, math rendering, content QA/gap dashboard (~8–10 days)      |
| —                                                               | **New:** importer, asset pipeline, math rendering, content QA/gap dashboard (~8–10 days)      |

### 2.6 Progress log — 2026-11-15

Phase 0 correctness work landed in `pyin-nyar-backend` and `pyin-nyar` (mobile). No schema migration was required.

| Item | Change                                                                                                                                                                                                                                                                                                                         | Verification                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| D1   | `AuthController` uses method-level `@Public()` only, so `/auth/me` and `/auth/logout-all` run behind the global `AuthGuard`.                                                                                                                                                                                                   | `src/auth/auth.controller.ts`                           |
| D2   | `AuthGuard` no longer wraps failures in `ForbiddenException`. Header checks moved outside the `try`, `HttpException` is rethrown untouched, unexpected errors map to 401, and role checks moved into a globally registered `RolesGuard` that throws 403. Mobile clears the cached session on any 401 and no longer retries it. | `auth.guard.spec.ts` (11 tests), mobile `hooks/auth.ts` |
| D3   | `GET /profile` omits `passwordHash` in the query projection and returns the joined `profile`.                                                                                                                                                                                                                                  | `profile.service.spec.ts`                               |
| D4   | Preferred subjects resolve by `id` on both create and update; ids are deduped; a grade mismatch logs a warning instead of blocking; the DTO field is renamed `preferredSubjectIds` and responses include subject ids so a PATCH can round-trip.                                                                                | `student-kyc.service.spec.ts` (11 tests)                |
| D7   | Signup and Google login create the `Profile` row in the same write; `GET /profile` lazily creates it, with a `P2002` race fallback so concurrent first reads do not 500.                                                                                                                                                       | `auth.service.spec.ts`, `profile.service.spec.ts`       |
| D12  | E2E test asserts the health payload instead of `"Hello World!"`.                                                                                                                                                                                                                                                               | `test/app.e2e-spec.ts`                                  |
| D13  | `RolesGuard` throws `ForbiddenException`, is registered globally after `AuthGuard`, and guards every `/admin/*` controller.                                                                                                                                                                                                    | `auth.guard.spec.ts`, `app.module.ts`                   |

Also landed in the same batch (previously uncommitted): chapter/lesson admin CRUD and public reads, quiz admin list/create, `@/` path aliases, and removal of the stale `prisma-generated.bak` tree.

Validation at time of writing: `pnpm test` → 35/35 passing across 6 files; `pnpm lint` → 0 errors (4 pre-existing warnings in `chapter.service.ts`); `tsc -p tsconfig.build.json --noEmit` clean; mobile `tsc --noEmit` and `pnpm lint` clean. E2E was not run (needs a live Postgres).

Still open in Phase 0: **D5**, **D6** (both need migrations), **D8** (prefix/CORS/helmet), **D9–D11**, and the remaining §8 tasks (corpus intake, CI, Sentry, env schema).

---

## 3. Definition of production

Production means **a student in Myanmar can install the app from a store, sign up, be placed in their grade, learn from real curriculum content, get a streamed AI explanation scoped to their lesson, photograph homework and get a hint-first walkthrough, take a generated quiz, see mastery change from that quiz, and receive a study plan for their weak topics — while an admin can review KYC and author curriculum, and we can detect and roll back a bad release within 30 minutes.**

### 3.1 Release gates (all must be true)

| Gate                 | Threshold                                                                                                                                                           | Verified by                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Core loop E2E        | Onboarding → lesson → tutor → quiz → mastery update → plan, all with real data                                                                                      | Staging scripted run + Maestro test |
| Auth correctness     | 401 on expired/missing token, single-flight refresh, logout everywhere                                                                                              | Integration + device test           |
| No PII leak          | Response snapshot tests assert no `passwordHash`, `docNumber`, `guardianPhone` in client payloads                                                                   | Contract tests                      |
| Test coverage        | ≥70% lines on `auth`, `conversation`, `quiz`, `mastery`, `upload` services; 100% of v1 endpoints have an e2e or integration test                                    | CI report                           |
| Content completeness | Every launch-grade subject has a published chapter/lesson tree with no empty lessons; Maths/Physics/Chemistry lessons have rendered equations; 0 broken asset links | Content QA report + link checker    |
| AI eval              | ≥90% of 120-item golden set pass rubric; 0 safety-policy failures                                                                                                   | Nightly eval report                 |
| Performance          | p95 non-AI API < 300 ms; time-to-first-token < 2.5 s p50 / 5 s p95; SSE drop rate < 2%                                                                              | k6 + production dashboards          |
| Reliability          | Crash-free sessions ≥ 99.5%; API error rate < 1%; 30-day uptime ≥ 99.5%                                                                                             | Sentry + uptime monitor             |
| Cost                 | Blended AI cost ≤ $0.015 per active student-day at beta usage                                                                                                       | Usage dashboard                     |
| Security             | OWASP ASVS L1 checklist complete; no high/critical from dependency or secret scan; pen-test findings triaged                                                        | Security review                     |
| Legal                | Privacy policy, terms, data-deletion path, AI disclosure, content licensing signed off                                                                              | Counsel review                      |
| Store                | Both stores approved; screenshots, descriptions, privacy labels, age rating complete                                                                                | App Store Connect / Play Console    |
| Operability          | Runbooks, dashboards, alerts, on-call rotation (even if one person), rollback rehearsed                                                                             | Ops review                          |

### 3.2 Explicit non-goals for v1

Voice tutor, dedicated English tutor mode, parent dashboard, teacher/classroom, PDF course generation, mind maps, audio lessons, payments/subscriptions, web app, offline lesson packs, multi-language UI beyond Burmese/English, push notifications beyond streaks (v1.1). **Also out of v1 scope:** Grade 10 and Grade 11 content, Biology (absent from the corpus), and verbatim redistribution of textbook text without written permission.

---

## 4. Target architecture

```
┌──────────────────────────────┐        ┌─────────────────────────────┐
│  Mobile (Expo SDK 58)        │        │  Admin (Vite SPA)           │
│  Expo Router · React Query   │        │  React Router · React Query │
│  SecureStore · SSE client    │        │  shadcn/Base UI             │
└──────────────┬───────────────┘        └──────────────┬──────────────┘
               │ HTTPS /v1 (JSON + SSE)                │ HTTPS /v1/admin
               ▼                                       ▼
        ┌──────────────────────────────────────────────────────┐
        │  NestJS API (stateless, horizontal)                  │
        │  AuthGuard → RolesGuard → Throttler → Validation     │
        │  modules: auth profile curriculum conversation       │
        │           upload quiz mastery study-plan progress    │
        │           admin audit                                │
        └───┬───────────┬──────────────┬──────────────┬────────┘
            │           │              │              │
            ▼           ▼              ▼              ▼
     ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐
     │ Postgres │ │  Redis    │ │  S3/R2     │ │ LLM / OCR    │
     │ (Prisma) │ │ BullMQ +  │ │ presigned  │ │ via adapter  │
     │          │ │ cache +   │ │ uploads    │ │ (streaming)  │
     │          │ │ rate limit│ │            │ │              │
     └──────────┘ └───────────┘ └────────────┘ └──────────────┘
            │
            ▼
     ┌──────────────────────────────────────────────────────┐
     │ Observability: Sentry · pino → log drain · OTel → APM │
     └──────────────────────────────────────────────────────┘
```

**Offline content pipeline (not on the request path)**

```
content/sources/g12/<subject>/       (GMS bundle: md + meta.json + images)
        │
        ▼
import-gms CLI
  1. validate manifest + checksums
  2. parse meta.table_of_contents → chapter/lesson skeleton
  3. normalize headings (dedupe, drop Example/Solution noise)
  4. segment markdown by heading + TOC page map
  5. rewrite image refs → LessonAsset rows, upload to R2
  6. detect gaps (empty sections, broken refs) → import report
        │
        ▼
Destination tables: SourceDocument · Chapter · Lesson · LessonAsset · ContentImport
        │
        ▼
Admin QA queue (preview, edit, publish) ──► published curriculum cache
```

The importer is a **CLI + admin job**, never a runtime scrape. It is idempotent, keyed on `(sourceDocumentId, pageStart, title)`, and writes a machine-readable report so a re-run is safe.

**Key architectural decisions**

| Decision          | Choice                                                                                                | Rationale                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API style         | REST + SSE, versioned `/v1`                                                                           | Simplest for Expo; SSE is well-supported and debuggable; GraphQL adds cost with no benefit here                                                                                    |
| Streaming         | `POST /v1/conversations/:id/messages` returns `text/event-stream`                                     | Works over `expo/fetch` streaming; avoids WebSocket lifecycle on mobile. **Verify the exact SDK 58 streaming API against `docs.expo.dev/versions/v58.0.0` before implementation.** |
| Auth              | Stateless access JWT (15 min) + rotating refresh token in `Session` (30 days)                         | Already built; add reuse detection and device metadata                                                                                                                             |
| Long jobs         | BullMQ on Redis (OCR, quiz generation, study-plan generation)                                         | Avoids holding HTTP connections; retry + backoff built in                                                                                                                          |
| File uploads      | Presigned PUT to S3-compatible storage; API never proxies bytes                                       | Cheaper, simpler, scales                                                                                                                                                           |
| AI provider       | Adapter interface, OpenAI-compatible first                                                            | Avoids lock-in; one code path covers OpenAI, Azure, OpenRouter, Together, vLLM                                                                                                     |
| Content           | DB-backed `Subject → Chapter → Lesson` with markdown body + `LessonAsset` images                      | Admin can author and publish without a deploy                                                                                                                                      |
| Content ingestion | Idempotent CLI importer from GMS bundles, then admin QA; no runtime scraping                          | Reproducible, reviewable, and tolerant of imperfect extraction                                                                                                                     |
| Math              | Store LaTeX verbatim (`$$…$$`); render with KaTeX on mobile                                           | ~1,100 equations must survive import and display                                                                                                                                   |
| Grounding         | Lesson-scoped prompt stuffing in v1; embeddings/pgvector only if cross-lesson search proves necessary | Most lessons fit in 2–4k tokens; avoids a vector DB in v1                                                                                                                          |
| Admin auth        | Same identity system, `ADMIN` role + strict CORS + IP allowlist in staging                            | No second auth system to secure; add 2FA post-v1                                                                                                                                   |
| Mobile data       | Generated types from OpenAPI + React Query hooks per domain                                           | Eliminates hand-written drift                                                                                                                                                      |

**Anti-corruption boundaries**

- `src/ai/` is the only place that knows about LLM vendors. No vendor SDK types leak into domain services.
- `src/storage/` is the only place that knows about S3. Services receive `{ url, key }`.
- Domain services never accept `userId` from the request body. `@CurrentUser()` is the only source of identity. (The existing `Create*Dto` classes all have `userId` fields — delete them.)

---

## 5. Data model changes

All migrations follow **expand → migrate → contract**. Never drop a column in the same release that stops writing it. Each migration is reversible or has a documented forward-fix.

### 5.1 New enums

```prisma
enum TutorMode {
  CHAT
  TEACH_ME
  HOMEWORK
  ENGLISH        // reserved; not exposed in v1 UI
}

enum MessageStatus {
  COMPLETE
  PARTIAL      // client disconnected mid-stream
  FAILED
}

enum UploadStatus {
  PENDING      // presigned URL issued
  UPLOADED     // client confirmed
  PROCESSING   // OCR/job running
  READY
  FAILED
}

enum MasteryScope {
  SUBJECT
  CHAPTER
  LESSON
}

enum QuizSource {
  LESSON
  UPLOAD
  WEAKNESS
  DAILY_PRACTICE
  ADMIN
}

enum AchievementCode {
  FIRST_LESSON
  FIRST_QUIZ
  STREAK_3
  STREAK_7
  STREAK_30
  MASTERY_50
  MASTERY_80
  PERFECT_QUIZ
  HOMEWORK_HELPER
  NIGHT_OWL
}

enum ContentFormat {
  MARKDOWN        // plain markdown, optional LaTeX
  MARKDOWN_LATEX  // contains $$…$$ blocks; renderer must support math
}

enum AssetKind {
  IMAGE
  DIAGRAM
  FIGURE
  TABLE
  PDF
}

enum ImportStatus {
  DRAFT
  PARSED
  NEEDS_REVIEW
  PUBLISHED
  FAILED
}

enum SourceLicense {
  OWNED
  LICENSED
  PERMISSION_GRANTED
  REFERENCE_ONLY   // may inform scope/eval, must not be served verbatim
}
```

### 5.2 Model changes

| Model           | Change                                                                                                                                                                                                                                   | Why                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `User`          | `onboardedAt DateTime?`, `timezone String? @default("Asia/Yangon")`, `deletedAt DateTime?`                                                                                                                                               | Onboarding gate; streak day boundaries; soft delete/erasure                                         |
| `Profile`       | `level Difficulty @default(EASY)` (rename to `learnerLevel` if clearer), `weeklyGoalMinutes Int @default(0)`, `preferredLanguage Language @default(BILINGUAL)`                                                                           | Adaptive difficulty seed; goals                                                                     |
| `Conversation`  | `mode TutorMode @default(CHAT)`, `uploadId String?`, `lastMessageAt DateTime?`, `summary String?`                                                                                                                                        | Teach Me/homework are conversation modes, not separate tables; `summary` enables context truncation |
| `Message`       | `status MessageStatus @default(COMPLETE)`, `promptVersion String?`, `latencyMs Int?`, `feedback String?` (`UP`/`DOWN`), `clientId String?`                                                                                               | Idempotency, eval traceability, quality signal                                                      |
| `Upload`        | `status UploadStatus @default(PENDING)`, `storageKey String`, `ocrProvider String?`, `ocrError String?`, `pageCount Int?`, `deletedAt DateTime?`                                                                                         | Real upload lifecycle                                                                               |
| `Quiz`          | `source QuizSource @default(LESSON)`, `promptVersion String?`, `generationMeta Json?`                                                                                                                                                    | Provenance and reproducibility                                                                      |
| `Question`      | `answerSpec Json?`, `rubric String?`, `explanationGeneratedAt DateTime?`                                                                                                                                                                 | Structured grading for fill/short answer                                                            |
| `MasteryScore`  | **Replace scope columns** with `scopeType MasteryScope`, `scopeId String`, `lastCorrectAt DateTime?`; `@@unique([userId, scopeType, scopeId])`                                                                                           | Fixes D5; supports all three levels                                                                 |
| `StudyPlan`     | `generatedFrom Json?`, `targetExam String?`                                                                                                                                                                                              | Reproducible plans                                                                                  |
| `StudyPlanItem` | `reason String?`, `estimatedMinutes Int?`                                                                                                                                                                                                | Explain _why_ an item is in the plan                                                                |
| `UsageLog`      | `@@index([userId, action, createdAt])`, `costUsd Decimal? @db.Decimal(10,6)`, `provider String?`                                                                                                                                         | Quota queries and cost dashboards                                                                   |
| `Subject`       | `grade Grade` **non-null**, `code String` **non-null**, `curriculumVersion String?`, `sourceDocumentId String?`, `@@unique([grade, code])`                                                                                               | Fixes D6; stable identifiers for seeding; links to the ingested source                              |
| `Chapter`       | `pageStart Int?`, `pageEnd Int?`, `sourceRef String?`                                                                                                                                                                                    | Page citations and provenance                                                                       |
| `Lesson`        | `sourceDocumentId String?`, `contentFormat ContentFormat @default(MARKDOWN)`, `pageStart Int?`, `pageEnd Int?`, `objectives String[]`, `estimatedMinutes Int?`, `checksum String?`, `publishedAt DateTime?`, `contentEditedAt DateTime?` | Import provenance, math format, citation ranges, publish control, drift detection                   |
| `Session`       | `lastUsedAt DateTime?`, `revokedReason String?`                                                                                                                                                                                          | Refresh reuse detection and support                                                                 |
| `Question`      | `@@index([quizId, type])`                                                                                                                                                                                                                | Analytics                                                                                           |

### 5.3 New models

```prisma
model SourceDocument {
  id            String        @id @default(cuid())
  grade         Grade
  subjectCode   String
  title         String
  publisher     String?
  edition       String?
  license       SourceLicense @default(REFERENCE_ONLY)
  licenseNote   String?
  pageCount     Int?
  checksum      String        @unique   // sha256 of the source markdown
  metadata      Json?                   // GMS meta.json, verbatim
  status        ImportStatus  @default(DRAFT)
  lessons       Lesson[]
  imports       ContentImport[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  @@unique([grade, subjectCode, edition])
}

model LessonAsset {
  id           String    @id @default(cuid())
  lessonId     String
  lesson       Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  kind         AssetKind @default(IMAGE)
  storageKey   String
  url          String
  alt          String?
  caption      String?
  page         Int?
  order        Int       @default(0)
  width        Int?
  height       Int?
  mimeType     String?
  checksum     String?
  createdAt    DateTime  @default(now())
  @@index([lessonId, order])
}

model ContentImport {
  id               String        @id @default(cuid())
  sourceDocumentId String?
  sourceDocument   SourceDocument? @relation(fields: [sourceDocumentId], references: [id], onDelete: SetNull)
  status           ImportStatus  @default(DRAFT)
  report           Json?         // per-section accepted/rejected/gap + broken refs
  chaptersCreated  Int           @default(0)
  lessonsCreated   Int           @default(0)
  assetsCreated    Int           @default(0)
  startedAt        DateTime      @default(now())
  finishedAt       DateTime?
  createdById      String
  createdAt        DateTime      @default(now())
  @@index([status, createdAt])
}

model ContentChunk {
  id         String   @id @default(cuid())
  lessonId   String
  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  order      Int
  heading    String?
  text       String
  pageStart  Int?
  pageEnd    Int?
  tokens     Int
  embedding  Unsupported("vector(1536)")?  // v1.1; only if pgvector is enabled
  createdAt  DateTime @default(now())
  @@index([lessonId, order])
}

model TeachSession {
  id             String   @id @default(cuid())
  userId         String
  conversationId String   @unique
  lessonId       String?
  step           String   @default("DIAGNOSE") // DIAGNOSE | EXPLAIN | CHECK | HINT | RETRY | PRACTICE | SUMMARY
  state          Json     @default("{}")       // question index, hint level, concept list
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  @@index([userId, startedAt])
}

model DailyActivity {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime @db.Date
  xp          Int      @default(0)
  minutes     Int      @default(0)
  questions   Int      @default(0)
  correct     Int      @default(0)
  @@unique([userId, date])
  @@index([userId, date])
}

model Achievement {
  code        AchievementCode @id
  name        String
  description String
  xpReward    Int             @default(0)
}

model UserAchievement {
  userId        String
  achievementId AchievementCode
  unlockedAt    DateTime @default(now())
  @@id([userId, achievementId])
}

model ContentReport {
  id          String   @id @default(cuid())
  userId      String
  messageId   String?
  reason      String
  detail      String?
  status      String   @default("OPEN") // OPEN | REVIEWED | ACTIONED
  createdAt   DateTime @default(now())
  @@index([status, createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  action     String   // "kyc.approve", "lesson.publish", "user.role_change"
  targetType String
  targetId   String
  metadata   Json?
  ip         String?
  createdAt  DateTime @default(now())
  @@index([actorId, createdAt])
  @@index([targetType, targetId])
}
```

**Relations to add on existing models** (required for the above to compile):

```prisma
model Subject {
  sourceDocumentId String?
  sourceDocument   SourceDocument? @relation(fields: [sourceDocumentId], references: [id], onDelete: SetNull)
}

model Lesson {
  sourceDocumentId String?
  sourceDocument   SourceDocument? @relation(fields: [sourceDocumentId], references: [id], onDelete: SetNull)
  assets           LessonAsset[]
  chunks           ContentChunk[]
}
```

`ContentChunk.embedding` is commented as v1.1 on purpose: enabling `pgvector` requires the extension and an embedding provider, neither of which v1 needs. v1 sends the whole lesson body (2–4k tokens) to the model.

### 5.4 Migration plan

| Migration                 | Contents                                                                                                                                     | Safety                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `m1_fix_subject_identity` | Backfill `Subject.grade`/`code`, add NOT NULL, drop old unique, add `@@unique([grade, code])`                                                | Backfill from existing rows; fail loudly if any null              |
| `m2_mastery_scope`        | Add `scopeType`, `scopeId`; backfill from `lessonId`/`chapterId`/`subjectId`; drop old columns and unique                                    | Existing table is empty in practice; still write backfill SQL     |
| `m3_tutor_runtime`        | `TutorMode`, `MessageStatus`, new `Conversation`/`Message` columns                                                                           | Additive                                                          |
| `m4_uploads`              | `UploadStatus`, storage fields, `deletedAt`                                                                                                  | Additive                                                          |
| `m5_quiz_provenance`      | `QuizSource`, `answerSpec`, `rubric`, indexes                                                                                                | Additive                                                          |
| `m6_progress`             | `DailyActivity`, `Achievement`, `UserAchievement`, `AuditLog`, `ContentReport`                                                               | Additive                                                          |
| `m7_teach`                | `TeachSession`, `Conversation.mode`, `summary`                                                                                               | Additive                                                          |
| `m8_user_lifecycle`       | `onboardedAt`, `timezone`, `deletedAt`, `Session.lastUsedAt`                                                                                 | Additive                                                          |
| `m9_content_pipeline`     | `SourceDocument`, `LessonAsset`, `ContentImport`, `ContentChunk`; `Lesson`/`Chapter` provenance + publish fields; `Subject.sourceDocumentId` | Additive; run before the first import                             |
| `m10_content_license`     | Backfill `SourceDocument.license` from the licence decision; constraint that a published lesson must have a non-`REFERENCE_ONLY` source      | Additive + check constraint; do **not** publish before this lands |

**Rules**

- Every migration has a `-- name` and a one-line comment describing intent.
- Run `prisma migrate diff` against staging before merging to confirm no drift.
- Destructive migrations (m1, m2) run in a maintenance window, with a verified backup and a tested down-path.
- Seed data is idempotent (`upsert` keyed on `[grade, code]` / `[chapterId, name]`) so it can run on every deploy.

---

## 6. Target API surface (v1)

All routes are prefixed `/v1`. All responses use the existing envelope `{ success, message, data }`. All authenticated routes derive identity from the access token; **no route accepts `userId` in the body**.

### 6.1 Auth & account

| Method | Path                           | Auth   | Notes                                    |
| ------ | ------------------------------ | ------ | ---------------------------------------- |
| POST   | `/auth/otp/request`            | public | Throttled 5/min/email + 10/min/IP        |
| POST   | `/auth/sign-up`                | public | Creates `Profile` row (fix D7)           |
| POST   | `/auth/login`                  | public |                                          |
| POST   | `/auth/google`                 | public | Creates `Profile` row                    |
| POST   | `/auth/refresh`                | public | Rotating; reuse detection revokes family |
| POST   | `/auth/logout`                 | public | Revokes one session                      |
| POST   | `/auth/logout-all`             | user   | Fixed by D1                              |
| GET    | `/auth/me`                     | user   | Fixed by D1; returns safe fields only    |
| POST   | `/auth/reset-password/verify`  | public |                                          |
| POST   | `/auth/reset-password/confirm` | public |                                          |
| PATCH  | `/auth/password`               | user   | Requires current password                |
| DELETE | `/auth/account`                | user   | Soft-delete + erase job                  |

### 6.2 Profile & onboarding

| Method | Path                      | Auth | Notes                                                                                                    |
| ------ | ------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| GET    | `/profile`                | user | Safe projection only (fix D3)                                                                            |
| PATCH  | `/profile`                | user | `name`, `avatarUrl`, `language`, `grade`, `targetExam`, `studyGoal`, `learnerLevel`, `weeklyGoalMinutes` |
| POST   | `/onboarding`             | user | Atomic: grade + language + preferred subject IDs + exam target + daily goal; sets `onboardedAt`          |
| GET    | `/progress/summary`       | user | XP, streak, level, weekly minutes, mastery headline                                                      |
| GET    | `/progress/daily?from&to` | user | `DailyActivity` series for charts                                                                        |
| GET    | `/achievements`           | user | Definition list + unlock state                                                                           |
| POST   | `/events`                 | user | Whitelisted client events (lesson opened, screen viewed) → `UsageLog`/analytics                          |

### 6.3 Curriculum

| Method | Path                     | Auth | Notes                                                                                                   |
| ------ | ------------------------ | ---- | ------------------------------------------------------------------------------------------------------- |
| GET    | `/subjects?grade=`       | user | Cached 5 min                                                                                            |
| GET    | `/subjects/:id`          | user | Includes chapter count                                                                                  |
| GET    | `/subjects/:id/chapters` | user | Ordered; excludes soft-deleted                                                                          |
| GET    | `/chapters/:id`          | user | Includes lessons (metadata only)                                                                        |
| GET    | `/lessons/:id`           | user | Includes `content`, `contentFormat`, `assets[]`, `pageStart/pageEnd`, breadcrumbs                       |
| GET    | `/lessons/:id/assets`    | user | Signed CDN URLs; cached                                                                                 |
| POST   | `/lessons/:id/complete`  | user | Records lesson completion event                                                                         |
| GET    | `/curriculum?grade=`     | user | Full tree in one request for offline-ish browsing                                                       |
| GET    | `/subjects/:id/coverage` | user | Which chapters/lessons are published, plus `updatedAt` — lets the UI say "content coming soon" honestly |

Lesson content is served only when `publishedAt` is set. Draft/imported lessons return `404` to students and `200` to admins.

Admin CRUD is in §6.9.

### 6.4 Tutor & Teach Me

| Method | Path                                  | Auth | Notes                                                                         |
| ------ | ------------------------------------- | ---- | ----------------------------------------------------------------------------- |
| POST   | `/conversations`                      | user | `{ title?, subjectId?, chapterId?, lessonId?, language, mode }`               |
| GET    | `/conversations?cursor&limit`         | user | Cursor pagination, newest first                                               |
| GET    | `/conversations/:id`                  | user | Messages (paginated), newest 50                                               |
| PATCH  | `/conversations/:id`                  | user | Title, language                                                               |
| DELETE | `/conversations/:id`                  | user | Soft delete                                                                   |
| POST   | `/conversations/:id/messages`         | user | **SSE**. Body `{ content, clientId }`. Emits `meta`, `delta`, `done`, `error` |
| GET    | `/conversations/:id/messages?before=` | user | History paging                                                                |
| POST   | `/messages/:id/feedback`              | user | `{ rating: "UP" \| "DOWN", reason? }`                                         |
| POST   | `/messages/:id/report`                | user | Creates `ContentReport`                                                       |
| POST   | `/conversations/:id/simplify`         | user | Re-answers last assistant message at a lower level                            |
| POST   | `/conversations/:id/translate`        | user | Re-answers in the other language                                              |
| POST   | `/teach-me`                           | user | `{ lessonId, language }` → `{ conversationId, teachSessionId, firstMessage }` |
| GET    | `/teach-me/:id`                       | user | State machine snapshot                                                        |
| POST   | `/teach-me/:id/answer`                | user | `{ answer }` → next step, hint, or feedback                                   |
| POST   | `/teach-me/:id/abandon`               | user |                                                                               |

### 6.5 Uploads & homework

| Method | Path                               | Auth | Notes                                                                                           |
| ------ | ---------------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| POST   | `/uploads/presign`                 | user | `{ filename, mimeType, size, type }` → `{ uploadId, url, key, expiresIn }`; validates type/size |
| POST   | `/uploads/:id/complete`            | user | Client confirms; enqueues OCR                                                                   |
| GET    | `/uploads/:id`                     | user | Status + `extractedText` when ready                                                             |
| POST   | `/uploads/:id/retry`               | user | Re-enqueue OCR (max 3)                                                                          |
| DELETE | `/uploads/:id`                     | user | Soft delete + storage cleanup job                                                               |
| POST   | `/homework`                        | user | `{ uploadId, language }` → conversation + first hint-first message                              |
| POST   | `/homework/:conversationId/action` | user | `{ action: "HINT" \| "EXPLAIN" \| "TEACH_ME" \| "QUIZ" \| "SUMMARY" }`                          |

### 6.6 Quizzes & attempts

| Method | Path                                  | Auth | Notes                                                                                                                                           |
| ------ | ------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/quizzes/generate`                   | user | `{ source: { lessonId?, uploadId?, subjectId?, chapterId? }, types[], count, difficulty, language }` → 202 with `jobId` or sync if <6 questions |
| GET    | `/quizzes?cursor`                     | user | Own + system quizzes                                                                                                                            |
| GET    | `/quizzes/:id`                        | user | Questions **without** answers when an attempt is not submitted                                                                                  |
| DELETE | `/quizzes/:id`                        | user | Owner only                                                                                                                                      |
| POST   | `/quizzes/:id/attempts`               | user | Starts attempt; returns attempt id + question set                                                                                               |
| GET    | `/attempts/:id`                       | user | Includes answers only if submitted                                                                                                              |
| PUT    | `/attempts/:id/answers`               | user | Upsert a single answer (autosave)                                                                                                               |
| POST   | `/attempts/:id/submit`                | user | Server-side grading; returns score, per-question correctness, explanations                                                                      |
| GET    | `/attempts?cursor`                    | user | History                                                                                                                                         |
| POST   | `/attempts/:id/abandon`               | user |                                                                                                                                                 |
| GET    | `/practice/daily`                     | user | Today's adaptive set (creates if absent)                                                                                                        |
| POST   | `/practice/daily/:attemptId/complete` | user | Feeds mastery + streak                                                                                                                          |

### 6.7 Mastery & study plans

| Method | Path                                | Auth | Notes                                                                              |
| ------ | ----------------------------------- | ---- | ---------------------------------------------------------------------------------- |
| GET    | `/mastery`                          | user | Full tree: subject → chapter → lesson scores                                       |
| GET    | `/mastery/weaknesses?threshold=0.6` | user | Ranked weak topics with attempt counts                                             |
| GET    | `/mastery/subjects/:id`             | user | Per-chapter breakdown                                                              |
| POST   | `/mastery/recompute`                | user | Idempotent rebuild from `Answer` history (support/debug)                           |
| POST   | `/study-plans/generate`             | user | `{ targetExam?, examDate?, subjects[], minutesPerDay }` → plan with reasoned items |
| GET    | `/study-plans?status=`              | user |                                                                                    |
| GET    | `/study-plans/:id`                  | user | Items with progress                                                                |
| PATCH  | `/study-plans/:id`                  | user | Status only                                                                        |
| POST   | `/study-plans/items/:id/complete`   | user |                                                                                    |
| DELETE | `/study-plans/:id`                  | user |                                                                                    |

### 6.8 Health & meta

| Method | Path            | Auth             | Notes                                             |
| ------ | --------------- | ---------------- | ------------------------------------------------- |
| GET    | `/health/live`  | public           | Process only                                      |
| GET    | `/health/ready` | public           | DB + Redis check                                  |
| GET    | `/meta/config`  | public           | Min app version, feature flags, maintenance mode  |
| GET    | `/docs`         | public (staging) | Swagger UI; disabled in production or behind auth |

### 6.9 Admin

| Method                | Path                                 | Role  | Notes                                                                             |
| --------------------- | ------------------------------------ | ----- | --------------------------------------------------------------------------------- |
| GET                   | `/admin/kyc?status=&cursor=`         | ADMIN | Queue with signed document URLs                                                   |
| GET                   | `/admin/kyc/:id`                     | ADMIN | Decrypted detail + audit trail                                                    |
| PATCH                 | `/admin/kyc/:id/status`              | ADMIN | Approve/reject + note; writes `AuditLog`                                          |
| GET/POST/PATCH/DELETE | `/admin/subjects`                    | ADMIN | Now includes `grade`/`code`                                                       |
| GET/POST/PATCH/DELETE | `/admin/chapters`                    | ADMIN | Reorder endpoint                                                                  |
| GET/POST/PATCH/DELETE | `/admin/lessons`                     | ADMIN | Markdown content, `contentFormat`, assets, publish flag                           |
| POST                  | `/admin/lessons/import`              | ADMIN | CSV/JSON bulk import with dry-run                                                 |
| POST                  | `/admin/lessons/:id/publish`         | ADMIN | Invalidate curriculum cache                                                       |
| GET                   | `/admin/content/sources`             | ADMIN | Ingested GMS bundles: title, pages, licence, checksum, status                     |
| POST                  | `/admin/content/sources`             | ADMIN | Register a bundle (manifest + checksum); rejects duplicates                       |
| POST                  | `/admin/content/imports`             | ADMIN | Start an import job: `{ sourceDocumentId, dryRun }` → `ContentImport`             |
| GET                   | `/admin/content/imports/:id`         | ADMIN | Status + full report (created/updated/skipped, gaps, broken refs)                 |
| POST                  | `/admin/content/imports/:id/publish` | ADMIN | Publish all `NEEDS_REVIEW` lessons that pass validation                           |
| GET                   | `/admin/content/coverage?grade=`     | ADMIN | Per-subject/chapter completeness, empty lessons, asset counts, unpublished drafts |
| PATCH                 | `/admin/content/sources/:id/license` | ADMIN | Set `SourceLicense` + note; required before publish                               |
| GET                   | `/admin/users?query=`                | ADMIN | Search, role, status                                                              |
| PATCH                 | `/admin/users/:id`                   | ADMIN | Role change (audited), disable                                                    |
| GET                   | `/admin/usage`                       | ADMIN | Tokens, cost, top users, error rate                                               |
| GET                   | `/admin/reports`                     | ADMIN | Content reports                                                                   |
| GET                   | `/admin/audit-logs`                  | ADMIN | Filterable                                                                        |

**Contract rules**

- Every list endpoint uses cursor pagination (`limit` max 50) — no offset paging.
- Every mutation returns the updated resource.
- Every DTO is explicit; `whitelist: true` + `forbidNonWhitelisted: true` once the mobile client stops sending extras.
- OpenAPI is generated in CI and committed as `openapi.json`; mobile types are generated from it.

---

## 7. AI layer design

### 7.1 Module layout

```
src/ai/
  ai.module.ts
  llm/
    llm.types.ts          // ChatMessage, LlmDelta, LlmResult, LlmProvider
    llm.service.ts        // routing, retry, timeout, usage logging
    providers/
      openai-compatible.provider.ts
      anthropic.provider.ts        // optional, same interface
  prompts/
    registry.ts           // id → { version, build(ctx) }
    tutor.system.ts
    teach-me.system.ts
    homework.system.ts
    quiz.generate.ts
    quiz.grade.ts
    study-plan.generate.ts
    summary.ts
  context/
    context-builder.service.ts     // budgeted message assembly
    curriculum-context.service.ts
    mastery-context.service.ts
    source-citation.service.ts     // lesson + page range + asset refs
  content/
    content-grounding.service.ts   // lesson body, chunk selection, citation building
    math-normalizer.ts             // LaTeX preservation + sanitization
  safety/
    moderation.service.ts
    redaction.service.ts
  quota/
    quota.service.ts
```

### 7.2 Provider interface

```ts
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonSchema?: object; // structured output
  signal?: AbortSignal;
}

export interface LlmDelta {
  type: "text";
  text: string;
}
export interface LlmResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: "stop" | "length" | "error";
}

export interface LlmProvider {
  readonly name: string;
  stream(messages: ChatMessage[], opts: LlmOptions): AsyncIterable<LlmDelta>;
  complete(messages: ChatMessage[], opts: LlmOptions): Promise<LlmResult>;
}
```

`LlmService` responsibilities: model routing (small model for titles/classification, large model for tutoring), one retry on 429/5xx with jitter, hard timeout (30 s stream idle, 90 s total), write `UsageLog` on every call (success or failure), and never log prompt bodies at `info`.

### 7.3 Prompt policy

| Concern          | Rule                                                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language         | System prompt is bilingual-aware. `language=MY` → Burmese explanation with English technical terms in parentheses. `EN` → English only. `BILINGUAL` → Burmese explanation + English term glossary.          |
| Curriculum scope | If `lessonId` is present, inject lesson content + chapter/subject names and instruct: "Teach only within this lesson's scope. If the question is outside it, say so and offer the nearest relevant lesson." |
| Grade level      | Inject grade + learner level; vocabulary and sentence length adapt.                                                                                                                                         |
| Socratic mode    | Teach Me prompt enforces: never state the final answer before the student has attempted twice; ask one question at a time; max 40 words per turn in `CHECK` step.                                           |
| Homework         | Hint ladder: level 1 conceptual nudge → level 2 method → level 3 worked step → answer only on explicit "show answer".                                                                                       |
| Safety           | Refuse self-harm, sexual content, violence instructions; redirect to a trusted adult for distress; no medical/legal advice; no PII requests.                                                                |
| Grounding        | If curriculum content exists, cite the lesson name; if not, say the answer is general and not from the textbook.                                                                                            |
| Persona          | Warm, concise, never condescending; no emojis in Teach Me (they distract), emojis allowed sparingly in chat.                                                                                                |

Prompts live in code, are versioned (`tutor.system.v3`), and every assistant `Message` stores `promptVersion` so quality regressions are traceable.

### 7.4 Context budget

| Component                                     | Budget            |
| --------------------------------------------- | ----------------- |
| System prompt                                 | ~800 tokens       |
| Curriculum excerpt (lesson content truncated) | ~2,500 tokens     |
| Mastery summary                               | ~300 tokens       |
| Last 8 turns                                  | ~1,500 tokens     |
| Current user message + upload text            | ~1,500 tokens     |
| **Total input cap**                           | **~6,600 tokens** |

If over budget: drop oldest turns → truncate lesson content at paragraph boundaries → summarize older turns into `Conversation.summary` (cheap model, once per 20 messages).

### 7.5 Streaming contract

```
event: meta
data: {"messageId":"...","conversationId":"...","model":"..."}

event: delta
data: {"text":"Photosynthesis is"}

event: done
data: {"messageId":"...","usage":{"prompt":1234,"completion":210},"finishReason":"stop"}

event: error
data: {"code":"QUOTA_EXCEEDED","message":"..."}
```

- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`, `Connection: keep-alive`.
- Send a `: ping` comment every 15 s.
- Client abort → server aborts provider call, persists `Message.status=PARTIAL` with partial text.
- Idempotency: `clientId` unique per conversation; a retry with the same `clientId` returns the stored message instead of re-billing.
- Mobile must use the Expo SDK 58 streaming fetch API; **check the versioned docs before coding** (per `AGENTS.md`), and add a fallback to non-streaming `POST .../messages?stream=false` if the runtime lacks `ReadableStream`.

### 7.6 Quotas and cost control

| Tier             | Limit (v1)                 |
| ---------------- | -------------------------- |
| Tutor messages   | 60/day, 400/week           |
| Quiz generations | 10/day                     |
| OCR pages        | 15/day                     |
| Study plans      | 3/day                      |
| Max input        | 8k tokens, max output 1.2k |

Implementation: Redis counter keyed `quota:{userId}:{action}:{yyyy-mm-dd}` with TTL to end of day (Asia/Yangon), reconciled to `UsageLog` nightly. On exceed: `429` with `{ code, resetAt }` and a friendly mobile message. Soft-launch users get higher limits via a `beta` flag.

Cost target math (to validate in Phase 2): if a 10-turn session costs ~$0.004 with a mid-tier model on cached prompts, 20 sessions/month/student ≈ $0.08/student/month. That is the ceiling for any pricing decision.

### 7.7 OCR design

| Option                             | Use                                 | Trade-off                                                       |
| ---------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| LLM vision (multimodal)            | Default for photos, especially math | Best at mixed Burmese/English and diagrams; higher cost; slower |
| Google Cloud Vision / AWS Textract | Bulk text, printed pages            | Cheaper, worse at handwriting and equations                     |
| On-device ML Kit                   | v1.1 offline fallback               | No server cost; quality risk                                    |

v1 flow: presign → upload → `complete` → BullMQ job → download from storage → resize/normalize → LLM vision with a "transcribe faithfully, preserve equations, mark illegible spans" prompt → store `extractedText` + confidence → `READY` or `FAILED`. Cap at 3 pages/image batches per upload for v1.

### 7.8 Quiz generation & grading

- Generation uses JSON-schema structured output: `{ questions: [{ type, question, options?, answer, explanation, difficulty, bloom }] }`; validate with Zod; reject and retry once on schema failure.
- Server assigns `order`, `points` (EASY 1, MEDIUM 2, HARD 3).
- Grading:
  - `MCQ` / `TRUE_FALSE`: exact match on normalized option id.
  - `FILL_BLANK`: trim, lowercase, strip punctuation/diacritics, accept an array of allowed answers; Burmese Unicode normalization (NFC) before compare.
  - `SHORT_ANSWER`: LLM rubric grading with the question, reference answer, and student answer → `{ correct, confidence, feedback }`; if `confidence < 0.7`, mark `needsReview` and do not penalize mastery.
- Explanations are generated at quiz creation, not at submit time, so submission is fast and offline-friendly.

### 7.9 Mastery algorithm (v1)

```
On each graded answer:
  lesson.key = (userId, LESSON, lessonId)
  α = 0.35 for attempts 1-5, 0.2 afterwards
  score = α * correct(0|1) + (1-α) * previousScore
  attempts += 1
  lastSeen = now; lastCorrectAt = correct ? now : unchanged

Chapter score = Σ(lesson.score * lesson.attempts) / Σ(lesson.attempts)
Subject score = Σ(chapter.score * chapter.attempts) / Σ(chapter.attempts)
```

- Confidence weighting: a topic with <3 attempts is shown as "not enough data", not 0%.
- Weakness = `score < 0.6 AND attempts >= 3`.
- Decay (post-v1): reduce score toward 0.5 if `lastSeen > 21 days`.
- Difficulty adaptation: last 5 answers ≥4 correct → difficulty up; ≤2 correct → down. Store on `Quiz.difficulty` for the next generated quiz, not on the user globally.
- **Never** let the LLM compute mastery. It explains and generates; deterministic code scores.

### 7.10 Study plan generation

1. Gather weaknesses (max 3), exam date, available minutes/day, subject preferences.
2. Compute total minutes available; allocate proportionally to weakness severity.
3. Ask the LLM only for **ordering and human-readable rationale** over a candidate set of lessons provided by code (never free-form lesson invention).
4. Validate every returned `lessonId` exists and belongs to the student's grade; drop hallucinated ids.
5. Persist `StudyPlan` + items with `dueDate`, `estimatedMinutes`, `reason`.

### 7.11 AI evaluation

- **Golden set**: 120 items derived from the G12 corpus (real exercises) plus 20 hand-written Burmese items. Split by mode: chat 40, Teach Me 30, homework 20, quiz 20, Burmese 10.
- Each item has expected concepts, forbidden content, a language requirement, and (for Maths/Physics/Chemistry) an expected equation or final value.
- Nightly job runs the set against staging, scores with a rubric LLM judge plus deterministic checks (mentions required concept, retains LaTeX validity, no answer leak in hint mode, language match), and posts a report.
- **Gate**: no prompt version ships if pass rate drops >3 points or any safety item fails.
- Human review: 20 samples/week during beta, tagged by failure type.
- **Licence gate**: eval fixtures may quote the corpus internally, but eval reports stored in the repo must use hashes/links, not verbatim textbook passages, until `D-CURRICULUM` is resolved in favour of redistribution.

### 7.12 Curriculum grounding from the corpus

The corpus changes grounding from "nice to have" to the main quality lever. v1 does **not** need a vector database.

| Concern                    | v1 approach                                                                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                      | If `lessonId` is set, inject the full lesson body (target ≤4k tokens) + chapter/subject names + `pageStart/pageEnd`.                                                                                                                                                                    |
| Cross-lesson questions     | Inject the current lesson, then the top 2 sibling lessons by heading similarity. Cap at 6k tokens.                                                                                                                                                                                      |
| Very long lessons          | Chunk by heading into 400–800-token pieces with 15% overlap; select the chunks whose headings match the question, keep document order, and prefix each with its page range.                                                                                                             |
| Citations                  | Every grounded answer returns `sources: [{ lessonId, title, pageStart, pageEnd }]`; the mobile bubble shows "Grade 12 Physics · p. 37".                                                                                                                                                 |
| Math                       | Normalize delimiters to `$$…$$`, keep LaTeX intact, strip OCR artifacts, and instruct the model to answer in LaTeX when the source is mathematical. Validate that output LaTeX parses before persisting; if not, fall back to plain text.                                               |
| Burmese                    | Preserve Unicode as-is (NFC), do not transliterate. Strip zero-width spaces left by OCR. Keep English technical terms in parentheses.                                                                                                                                                   |
| Images                     | Do not send page images to the LLM by default (cost/latency). If a question references a figure, attach only the `LessonAsset` images for that lesson, capped at 2.                                                                                                                     |
| Unpublished/absent content | If the lesson has no body (Physics/Chemistry gaps), the prompt must say "no textbook content is available for this lesson" and answer generally, with a visible disclaimer. Never fabricate a citation.                                                                                 |
| Licence                    | If `SourceDocument.license = REFERENCE_ONLY`, the grounding service may use the text internally for retrieval/eval but must not return verbatim passages longer than a short quote, and must not expose the raw lesson body through the API. Enforce in the serialiser, not the prompt. |

**Retrieval upgrade (v1.1):** if cross-subject search or "ask anything" ships, add `pgvector`, embed `ContentChunk`, and switch to hybrid (BM25 + vector) retrieval. The schema already reserves the column.

---

## 8. Phase 0 — Foundations & blockers

**Goal:** Make the existing system correct, secure, observable, and bootable, and give the AI something real to point at.
**Duration:** 10 working days · **Depends on:** nothing · **Blocks:** everything

### 8.1 Backend correctness

| #    | Task                                                                                                                                                                                                                       | Owner  | Acceptance criteria                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 0.1  | Fix auth semantics: `AuthGuard` must throw `UnauthorizedException` (401) for missing/invalid/expired tokens, and only `ForbiddenException` (403) for authenticated-but-wrong-role. Add tests for both.                     | BE     | `GET /v1/auth/me` with no token → 401; with expired token → 401; viewer calling admin route → 403.    |
| 0.2  | Remove class-level `@Public()` from `AuthController`; annotate only genuinely public handlers. Verify `/me` and `/logout-all` receive `user.sub`.                                                                          | BE     | Integration test: `/me` returns the caller; `/logout-all` revokes sessions; both 401 without a token. |
| 0.3  | Apply `RolesGuard` globally after `AuthGuard`, make it throw `ForbiddenException`, and annotate all `/admin/*` controllers with `@Roles("ADMIN")`.                                                                         | BE     | A `STUDENT` token gets 403 on every admin route; `ADMIN` gets 200.                                    |
| 0.4  | Fix `ProfileService` projection: return only `id, email, userName, name, avatarUrl, role, language, grade, createdAt` + joined `profile`. Add `PATCH /profile`.                                                            | BE     | Snapshot test asserts no `passwordHash`; update persists.                                             |
| 0.5  | Lazy-create `Profile` on signup, Google login, and first `GET /profile` (upsert).                                                                                                                                          | BE     | New signup has exactly one `Profile` row; concurrent first reads do not 500.                          |
| 0.6  | Fix KYC subject contract: `CreateStudentKycDto.preferredSubjectIds: string[]`; both create and update resolve by `id` and validate the subject exists and matches the user's grade (warn, don't block).                    | BE     | Create and update with the same payload produce the same relations; invalid id → 400.                 |
| 0.7  | Add `CORS` allowlist (`APP_ORIGINS`), global prefix `/v1` (exclude `/health/*` and `/docs`), `helmet`, `compression`, 1 MB JSON body limit, trust proxy.                                                                   | BE     | Staging admin origin passes preflight; unknown origin blocked; mobile calls `/v1/*`.                  |
| 0.8  | Split health into `/health/live` and `/health/ready` (DB + Redis); keep `/` as a redirect to docs or remove.                                                                                                               | BE     | k8s/Fly checks can distinguish liveness from dependency failure.                                      |
| 0.9  | Make `EmailService` fail lazily (log a warning, throw only on send) and add a dev "console transport" when `RESEND_API_KEY` is unset.                                                                                      | BE     | Backend boots with no Resend key in `NODE_ENV=development`.                                           |
| 0.10 | Make OTP logging structurally impossible in production: guard on `NODE_ENV === "development"` **and** an explicit `OTP_DEV_LOG=true`; add a startup assertion that refuses to boot in production if `OTP_DEV_LOG` is true. | BE     | Production boot with the flag set exits non-zero.                                                     |
| 0.11 | Complete `.env.example` for backend and mobile; add a startup `env.schema.ts` (Zod) that validates all required variables and prints all missing ones at once.                                                             | BE/MOB | Fresh clone + copy `.env.example` boots; missing var produces a readable list, not a stack trace.     |
| 0.12 | Fix the e2e test to assert health JSON; add an e2e harness that boots the app with a test database.                                                                                                                        | BE     | `pnpm test:e2e` passes locally and in CI.                                                             |
| 0.13 | Commit the uncommitted work in `pyin-nyar-backend` in reviewable commits; initialize git in `pyin-nyar-admin`.                                                                                                             | OPS    | `git status` clean in all three; admin has an initial commit.                                         |

### 8.2 Curriculum read/write surface

| #    | Task                                                                                                                                                                                                                                                      | Owner      | Acceptance criteria                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| 0.14 | Build `ChapterService` + admin CRUD (`/v1/admin/chapters`) and public reads (`/v1/subjects/:id/chapters`, `/v1/chapters/:id`).                                                                                                                            | BE         | Create/reorder/soft-delete; public list respects `order` and `deletedAt`.               |
| 0.15 | Build `LessonService` + admin CRUD and public reads (`/v1/chapters/:id/lessons`, `/v1/lessons/:id`, `GET /v1/curriculum?grade=`).                                                                                                                         | BE         | Lesson content returned only on detail; list is lightweight.                            |
| 0.16 | Add `grade`/`code` identity fix (migration m1) and enforce in DTOs.                                                                                                                                                                                       | BE         | Duplicate `(grade, code)` → 409; null grade rejected.                                   |
| 0.17 | Build an idempotent curriculum seed script (`prisma/seed/curriculum.ts`) reading JSON fixtures. Seed a 5-subject Grade 12 smoke dataset (1 chapter × 2 lessons each) from the corpus manifest, including one lesson with `$$` math and one with an image. | BE/CONTENT | `pnpm db:seed` twice → same row counts; mobile curriculum and lesson screens render it. |
| 0.18 | Add `content/README.md` describing the source format (manifest, meta.json, page map, licence field) and the import workflow; move the §2.5 inventory into `content/QUALITY.md`.                                                                           | CONTENT    | A reviewer can tell what is safe to publish without opening the markdown.               |

### 8.3 Mobile unblockers

| #    | Task                                                                                                             | Owner  | Acceptance criteria                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| 0.19 | Fix refresh flow: single-flight refresh on 401; queue concurrent requests; logout + redirect on refresh failure. | MOB    | Expired access token during three parallel requests triggers one refresh and all three succeed. |
| 0.20 | Add `EXPO_PUBLIC_API_URL` and a typed `apiClient` with error normalization and a request-id header.              | MOB    | All requests go to `/v1`; network errors show a retryable message.                              |
| 0.21 | Add OpenAPI type generation (`openapi-typescript`) and a `pnpm gen:api` script; wire into CI.                    | MOB/BE | Generated types compile; CI fails if `openapi.json` is stale.                                   |
| 0.22 | Add Sentry to mobile and backend with release/environment tagging and PII scrubbing.                             | MOB/BE | A thrown test error appears in Sentry with the correct release.                                 |

### 8.4 Corpus intake

| #    | Task                                                                                                                                                                                                                         | Owner      | Acceptance criteria                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| 0.23 | Move `curriculum/*GMS` into `content/sources/g12/<subject>/` and add a `content/manifest.json` (subject, grade, files, sha256, page count, extraction method). Do not leave 14 MB of untracked source in the workspace root. | OPS        | `git status` shows only the moved manifest; checksums match. Use Git LFS if the image set grows past ~50 MB. |
| 0.24 | Write `content/QUALITY.md`: the §2.5 inventory plus per-book gaps, broken refs, heading noise, and extraction method.                                                                                                        | CONTENT    | A reviewer can tell which lessons are safe to publish without opening the markdown.                          |
| 0.25 | **⚠ Decision D-CURRICULUM:** obtain the licence position (verbatim redistribution, permission, or reference-only) and record it per book.                                                                                    | OPS        | `SourceDocument.license` can be filled for all five books; no ingestion runs before this is answered.        |
| 0.26 | Add a link checker + markdown sanity script (`content:lint`) that fails on empty image refs, missing assets, unbalanced `$$`, and duplicate headings.                                                                        | BE/CONTENT | Current corpus produces a baseline report: 10 empty refs, 13 Physics chapters with no body, Chemistry gaps.  |

### 8.5 Phase 0 exit criteria

- All §2.4 defects are closed and covered by tests.
- `curl` script proves: 401 → refresh → 200; admin route rejects student; profile has no hash; curriculum tree returns published Grade 12 data.
- CI (lint, typecheck, unit, e2e) is green on all three repos.
- Backend and mobile `.env.example` are sufficient for a fresh clone.
- Corpus is moved, checksummed, quality-documented, and has a licence answer.

---

## 9. Phase 1 — Curriculum ingestion & onboarding

**Goal:** Turn the five GMS bundles into a published Grade 12 curriculum (five subjects), and let a student onboard, browse it, and open a lesson with real content, equations, and images.

**Duration:** 12 days · **Depends on:** Phase 0 (including the licence answer) · **Content may run in parallel from week 1**

**Scope decision:** the corpus is **Grade 12 only** and contains **five subjects** — Myanmar, English, Mathematics, Physics, Chemistry. **Biology is not in the corpus** and is deferred. v1 onboarding therefore offers Grade 12 only; other grades show "coming soon". Do not silently ship an empty Grade 10/11 selector.

### 9.1 Ingestion pipeline

| #    | Task                                                                                                                                                                                                                                                         | Owner       | Acceptance criteria                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Apply the licence outcome per source. If `REFERENCE_ONLY`, the publish step must rewrite bodies rather than copy them; if permission is granted, record the agreement and enable verbatim mode.                                                              | OPS/CONTENT | `SourceDocument.license` set for all five; publish endpoint refuses `REFERENCE_ONLY` sources.                                                                         |
| 1.2  | Source normalizer: strip repeated page headers/footers, unwrap `<b>`/`<sub>` where safe, dedupe repeated `# UNIT n` headings, collapse OCR spacing artifacts, and NFC-normalize Burmese.                                                                     | BE          | Re-running the normalizer twice produces byte-identical output (idempotent).                                                                                          |
| 1.3  | Build `import-gms` CLI: read manifest + `meta.json`, map page ids to headings, segment into `Chapter`/`Lesson`, preserve `$$` blocks, rewrite image refs to `LessonAsset` placeholders, and emit a `ContentImport` report.                                   | BE          | Dry-run on all five books completes < 60 s; report lists per-book chapters/lessons/assets/gaps.                                                                       |
| 1.4  | Segmentation heuristics: chapter/unit detection, lesson title selection, noise filtering (`Example`, `Solution`, `Q 1 to Q 4`, repeated unit openers), and minimum-body checks.                                                                              | BE          | Maths yields 11 chapters; English yields 12 units + 4 reviews + 4 poems; Myanmar yields its section tree; **0 lessons with an empty body unless explicitly flagged**. |
| 1.5  | Page mapping + citations: store `pageStart`/`pageEnd` per chapter and lesson from the TOC polygons where available, otherwise from nearest heading.                                                                                                          | BE          | Spot-check 20 lessons: page ranges match the printed book within ±1 page.                                                                                             |
| 1.6  | Asset pipeline: upload ~330 images to R2, set stable keys (`g12/maths/p120/fig-3.jpg`), attach to lessons in document order, generate alt text (manual for figures, filename fallback otherwise), and replace the 10 broken refs with a visible placeholder. | BE/CONTENT  | 0 broken links in the link checker; every published lesson asset returns 200 via CDN.                                                                                 |
| 1.7  | Physics completion plan: TOC produces 13 chapters and their lesson skeletons with **no bodies**. Author chapter summaries + learning outcomes first, full bodies second.                                                                                     | CONTENT     | Physics has 13 chapters, ≥50 lesson records, and every published lesson has ≥150 words of original body.                                                              |
| 1.8  | Chemistry gap completion: ingest pp. 20–40, explicitly flag missing §1.1–1.4 and everything after §2.3, and author the missing sections.                                                                                                                     | CONTENT     | No lesson is published with a "missing section" flag; gap report is zero for launch chapters.                                                                         |
| 1.9  | Publish workflow: `DRAFT → NEEDS_REVIEW → PUBLISHED`, with validation (non-empty body, licence, assets exist, math balanced) and cache invalidation.                                                                                                         | BE          | A lesson missing any check cannot be published; public API returns only `PUBLISHED`.                                                                                  |
| 1.10 | Idempotent seed/import runner for local + staging, keyed on `(sourceDocumentId, pageStart, title)`.                                                                                                                                                          | BE          | Running import twice does not duplicate chapters/lessons/assets.                                                                                                      |
| 1.11 | Corpus QA report: coverage per subject, empty lessons, assets, math count, missing pages, and a diff against the TOC. Available as CLI output in Phase 1; surfaced in the admin UI in Phase 8.                                                               | BE/CONTENT  | Report is generated in CI and archived per import.                                                                                                                    |

### 9.2 Lesson rendering

| #    | Task                                                                                                                                                                                                | Owner | Acceptance criteria                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------- |
| 1.12 | Mobile markdown renderer: headings, lists, tables, inline images, links, blockquotes, and code.                                                                                                     | MOB   | 20 sampled lessons from each subject render without layout breakage.                        |
| 1.13 | LaTeX rendering: pick and verify a renderer for Expo SDK 58 (KaTeX in a WebView, or a native math view). Render inline and display math, including `aligned`, fractions, subscripts, and `\text{}`. | MOB   | 30 Maths and 15 Chemistry equations render correctly on iOS + Android; no raw `$$` visible. |
| 1.14 | Image viewer: tap to zoom, caption, alt text, and graceful placeholder for missing assets.                                                                                                          | MOB   | Works offline for cached lessons; placeholder is distinguishable from a loading state.      |
| 1.15 | Burmese typography: font fallback, line height, and justification for long Myanmar passages; verify on a 360 dp Android device.                                                                     | MOB   | No clipped glyphs, no overlapping tone marks, readable at default text size.                |
| 1.16 | "Source" footer on each lesson: subject, chapter, page range, and licence attribution (or "original content" when rewritten).                                                                       | MOB   | Footer matches `SourceDocument` metadata.                                                   |

### 9.3 Onboarding & personalization

| #    | Task                                                                                                                                                   | Owner | Acceptance criteria                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | -------------------------------------------------------------------------------------------------------- |
| 1.17 | `POST /v1/onboarding` atomic transaction: grade, language, preferred subject IDs, exam target, daily goal, `onboardedAt`.                              | BE    | Partial failure rolls back everything; calling twice is idempotent.                                      |
| 1.18 | Mobile onboarding flow (4 steps): grade (Grade 12 only, with "more grades coming") → subjects (5 available, min 1) → language → goal/exam date → done. | MOB   | A new account is forced through onboarding before tabs; back/forward preserves state; accessible labels. |
| 1.19 | Curriculum browser: subject grid → chapter list → lesson detail, with published-only filtering, progress check, and "Ask tutor about this lesson" CTA. | MOB   | Real ingested data; loading/empty/error states; deep link `app/lesson/[id]`.                             |
| 1.20 | Cache curriculum + assets in React Query (`staleTime: 10m`) and persist the last viewed grade.                                                         | MOB   | Airplane mode after first load still shows the last curriculum tree and lesson text.                     |

**Exit criteria:** a fresh install → onboarding (Grade 12) → choose Physics → see 13 chapters → open a published lesson with body text, an image, and (for Maths/Chemistry) rendered equations → tap "Ask tutor". The import report shows zero unpublished gaps in the launch chapters, and the licence field is set on all five sources.

---

## 10. Phase 2 — AI Tutor + Teach Me

**Goal:** The chat screen becomes a real, streaming, curriculum-scoped tutor, and Teach Me becomes a stateful learning loop.
**Duration:** 15 days · **Depends on:** Phase 1, provider decision

### 10.1 Backend

| #    | Task                                                                                                                                                                          | Owner | Acceptance criteria                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | **⚠ Decision D-LLM:** choose primary provider. Recommended: an OpenAI-compatible endpoint (OpenAI or Azure OpenAI) + a second adapter behind the same interface for failover. | BE    | Keys in secret manager; provider config is environment-driven.                                                             |
| 2.2  | Implement `LlmProvider` + `LlmService` with retry, timeout, usage logging, and a `MockProvider` for tests.                                                                    | BE    | Unit tests cover 429 retry, timeout abort, and usage row creation.                                                         |
| 2.3  | Prompt registry with versioned tutor and Teach Me prompts; `promptVersion` persisted per message.                                                                             | BE    | Changing a prompt requires a version bump (lint rule/test).                                                                |
| 2.4  | Conversation CRUD + ownership checks (every query filtered by `userId`).                                                                                                      | BE    | User B cannot read/patch/delete User A's conversation (404, not 403).                                                      |
| 2.5  | SSE message endpoint with `meta`/`delta`/`done`/`error`, heartbeat, abort handling, `clientId` idempotency.                                                                   | BE    | `curl -N` shows tokens; disconnect stores `PARTIAL`; duplicate `clientId` does not double-charge.                          |
| 2.6  | Context builder: grade, language, lesson scope, mastery summary, last 8 turns, token budget.                                                                                  | BE    | Snapshot test of the assembled prompt for a fixed fixture.                                                                 |
| 2.7  | Quota service + `429` payload with `resetAt`; Redis counters reconciled nightly.                                                                                              | BE    | 61st message in a day → 429; counter resets at midnight Asia/Yangon.                                                       |
| 2.8  | Moderation + redaction: block disallowed categories, strip emails/phones from prompts.                                                                                        | BE    | Safety eval set passes; redaction unit tests.                                                                              |
| 2.9  | Feedback + report endpoints.                                                                                                                                                  | BE    | Feedback persists; report creates `ContentReport`.                                                                         |
| 2.10 | Teach Me state machine: `DIAGNOSE → EXPLAIN → CHECK → (HINT → RETRY)* → PRACTICE → SUMMARY`, persisted in `TeachSession.state`.                                               | BE    | Deterministic tests for correct, incorrect, hint escalation, and completion paths; answer never leaks before two attempts. |
| 2.11 | `simplify` and `translate` endpoints (re-answer last assistant turn with a modified prompt).                                                                                  | BE    | Output changes register/language; original message retained.                                                               |

### 10.2 Mobile

| #    | Task                                                                                                                    | Owner | Acceptance criteria                                                                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| 2.12 | Replace `cannedReply()` with the streaming client; token-by-token rendering, stop button, retry, and error states.      | MOB   | First token < 2.5 s on 4G; stop aborts server call; retry does not duplicate the message. |
| 2.13 | Conversation list + new chat sheet (subject/lesson scope, language, mode).                                              | MOB   | Scope is visible in the header; changing it starts a new conversation.                    |
| 2.14 | Message actions: simplify, example, translate, copy, report, thumbs.                                                    | MOB   | Actions call the real endpoints; optimistic UI rolls back on failure.                     |
| 2.15 | Teach Me screen: step indicator, concept card, answer input (text + MCQ), hint reveal, "I'm stuck", completion summary. | MOB   | Full loop completes against staging; state survives app backgrounding.                    |
| 2.16 | Persist drafts and last-read position; restore conversation on reopen.                                                  | MOB   | Kill the app mid-stream → reopen shows the partial message and a retry affordance.        |
| 2.17 | Burmese/English toggle mid-conversation with confirmation.                                                              | MOB   | Toggle affects the next message only.                                                     |

**Exit criteria:** a student opens a Grade 12 Physics lesson, asks a question, gets a streamed Burmese/English answer that references the lesson, taps "Teach me", answers two questions, receives a hint after a wrong answer, and finishes the loop. Tokens and cost appear in `UsageLog`.

---

## 11. Phase 3 — Upload, OCR, photo tutor

**Goal:** Photograph a homework page and get a hint-first walkthrough.
**Duration:** 10 days · **Depends on:** Phase 2

| #    | Task                                                                                                     | Owner  | Acceptance criteria                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| 3.1  | **⚠ Decision D-STORAGE:** S3 vs Cloudflare R2. Recommended: R2 (no egress fees) with S3-compatible API.  | OPS    | Bucket per environment; lifecycle rule deletes soft-deleted objects after 30 days.         |
| 3.2  | Storage module + presign endpoint; validate MIME by magic bytes after upload, max 10 MB, image/PDF only. | BE     | Fake `.png` (actually a zip) rejected; oversized file rejected at presign.                 |
| 3.3  | Upload lifecycle: `PENDING → UPLOADED → PROCESSING → READY/FAILED`, BullMQ job, retry ×3 with backoff.   | BE     | Kill the worker mid-job → job retries; status visible via polling.                         |
| 3.4  | OCR via LLM vision with faithful-transcription prompt; store text + provider + error.                    | BE     | 20 handwritten/printed samples transcribed with acceptable quality; failures are explicit. |
| 3.5  | `POST /v1/homework` creates a conversation with the extracted text and a hint-first first message.       | BE     | Conversation is linked to `uploadId`; first message contains no final answer.              |
| 3.6  | Homework action endpoint: hint → explain → teach me → quiz → summary.                                    | BE     | Each action produces the expected artifact; hint escalation is monotonic.                  |
| 3.7  | Mobile camera/gallery picker with crop, compress, upload progress, OCR processing state.                 | MOB    | Works on iOS and Android; denial of permission shows a settings deep link.                 |
| 3.8  | Photo → action sheet UI matching the product sketch (Explain / Summarize / Quiz / Teach me / Ask me).    | MOB    | Every action works end to end; loading states are distinct from errors.                    |
| 3.9  | EXIF strip, image orientation fix, and downscale before upload.                                          | MOB    | Uploaded images carry no GPS metadata.                                                     |
| 3.10 | Image retention policy: originals deleted after 30 days, text retained.                                  | BE/OPS | Cleanup job verified in staging.                                                           |

**Exit criteria:** photo of a printed physics problem → extracted text visible → "Teach me" starts a Socratic loop → no answer revealed until two attempts.

---

## 12. Phase 4 — Quizzes, attempts, grading

**Goal:** Generate a quiz from a lesson or upload, take it, get graded and explained.
**Duration:** 12 days · **Depends on:** Phase 3

| #    | Task                                                                                                      | Owner | Acceptance criteria                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------- |
| 4.1  | Quiz generation service with structured output + Zod validation + one repair retry.                       | BE    | 50 generations: 100% valid schema, 0 duplicate questions, all scoped to the source. |
| 4.2  | Question type support: MCQ, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER; difficulty mix by request.              | BE    | Each type round-trips through generation, storage, and display.                     |
| 4.3  | Attempt lifecycle: start, autosave answer (`PUT`), submit, abandon; one active attempt per quiz per user. | BE    | Concurrent submits are idempotent; submitting twice returns the same result.        |
| 4.4  | Deterministic grading for MCQ/TF/fill (Unicode NFC normalization) and rubric grading for short answer.    | BE    | Golden grading set of 60 answers ≥95% agreement with human labels.                  |
| 4.5  | Answer hiding: quiz payload omits `answer`/`explanation` until the attempt is submitted.                  | BE    | Contract test asserts fields absent before submit.                                  |
| 4.6  | Result payload: score, per-question correctness, correct answer, explanation, time spent.                 | BE    | Mobile can render a full review screen from one request.                            |
| 4.7  | Daily practice generator: 8 questions from weakest topics, adaptive difficulty.                           | BE    | Deterministic given a seeded mastery state; no repeats within 7 days.               |
| 4.8  | Generation queue + job status for large quizzes.                                                          | BE    | 20-question generation returns 202 and completes < 60 s.                            |
| 4.9  | Mobile quiz flow: generate sheet → question UI per type → progress → submit → result review.              | MOB   | All four types render and grade; back navigation warns before losing answers.       |
| 4.10 | Practice tab wired to daily practice + streak counter from `DailyActivity`.                               | MOB   | No hardcoded arrays remain in `practice.tsx`.                                       |
| 4.11 | Offline tolerance: answers stored locally and flushed on reconnect.                                       | MOB   | Submit after airplane mode succeeds once connectivity returns.                      |

**Exit criteria:** generate a 10-question mixed quiz from a lesson, take it on a device, receive a graded result with explanations, and see the attempt in history.

---

## 13. Phase 5 — Mastery, weakness, study plans

**Goal:** Close the loop. Every attempt changes mastery; weaknesses produce a plan.
**Duration:** 12 days · **Depends on:** Phase 4

| #    | Task                                                                                                 | Owner | Acceptance criteria                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| 5.1  | `MasteryService.recomputeForAnswer()` with EWMA, scope rollups, and `lastCorrectAt`.                 | BE    | Property test: monotonic improvement increases score; wrong answers decrease it; rollups equal weighted means.       |
| 5.2  | Recompute triggered inside the submit transaction (or immediately after, idempotently).              | BE    | Duplicate submit does not double-count attempts.                                                                     |
| 5.3  | `GET /mastery` tree + `GET /mastery/weaknesses` with confidence gating.                              | BE    | <3 attempts shows "not enough data"; weak list sorted by severity.                                                   |
| 5.4  | `POST /mastery/recompute` rebuild from `Answer` history.                                             | BE    | Rebuild matches incremental state exactly for a fixture user.                                                        |
| 5.5  | Study-plan generator with deterministic allocation + LLM ordering/rationale + lesson-id validation.  | BE    | 20 plans: 0 hallucinated lessons, all items belong to the student's grade, minutes sum to the requested budget ±10%. |
| 5.6  | Study-plan CRUD + item completion; completing a plan item can deep-link to the lesson.               | BE    | Plan progress percentage is correct after partial completion.                                                        |
| 5.7  | Mobile mastery visualization: subject → chapter → lesson, color-coded, with "needs practice" badges. | MOB   | Reflects real API data; empty state is honest ("take a quiz to see this").                                           |
| 5.8  | Weakness screen with a "Build recovery plan" CTA.                                                    | MOB   | Generates and displays a plan in < 15 s.                                                                             |
| 5.9  | Study plan screen: today's items, due dates, completion, reschedule.                                 | MOB   | Completing an item updates progress without a full refetch.                                                          |
| 5.10 | Home screen "next best action" card driven by weakness + plan.                                       | MOB   | Card changes after mastery changes.                                                                                  |

**Exit criteria:** a student takes three quizzes, mastery moves visibly, the weakness list names the weak chapter, and a generated plan contains only valid lessons.

---

## 14. Phase 6 — Mobile integration

**Goal:** Remove every hardcoded array and make the app feel like one product.
**Duration:** 10 days · **Depends on:** Phases 1–5

| #   | Task                                                                                                         | Owner | Acceptance criteria                                                             |
| --- | ------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------------- |
| 6.1 | Audit every screen for local constants; replace with API-backed hooks.                                       | MOB   | `grep` shows no module-level fake data in `src/app/` or `src/components/`.      |
| 6.2 | Standardize query keys, invalidation, optimistic updates, and error boundaries per domain.                   | MOB   | Quiz submit invalidates mastery, progress, and home in one action.              |
| 6.3 | Design system pass: loading skeletons, empty states, error states, offline banner, retry.                    | MOB   | Every screen has all five states implemented.                                   |
| 6.4 | Navigation restructure: tabs = Home, Learn, Practice, Progress, Profile; tutor is a stack route.             | MOB   | No dead ends; deep links work for lesson, conversation, quiz result.            |
| 6.5 | Profile screen: real stats, settings (language, grade, goals), logout-all, delete account.                   | MOB   | Delete account confirms and completes.                                          |
| 6.6 | Accessibility pass: dynamic type, screen-reader labels, contrast, touch targets ≥44 pt.                      | MOB   | VoiceOver/TalkBack can complete onboarding and one quiz.                        |
| 6.7 | Performance pass: list virtualization, image caching, bundle analysis, startup time.                         | MOB   | Cold start < 3 s on a mid-range Android; no JS thread stall > 100 ms in chat.   |
| 6.8 | Analytics events with a documented taxonomy.                                                                 | MOB   | Funnel: install → onboarding → lesson → chat → quiz → plan is measurable.       |
| 6.9 | App config: bundle ids, icons, splash, permission strings, iOS privacy manifest, Android data safety inputs. | MOB   | `expo-doctor` clean; `eas build --profile preview` succeeds for both platforms. |

---

## 15. Phase 7 — Gamification & progress

**Goal:** Motivation that reflects real learning, not vanity counters.
**Duration:** 6 days · **Depends on:** Phase 5

| #   | Task                                                                                         | Owner | Acceptance criteria                                                         |
| --- | -------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| 7.1 | `DailyActivity` upsert on lesson completion, quiz submit, and chat turn.                     | BE    | One row per user per Asia/Yangon date; idempotent.                          |
| 7.2 | XP rules table (lesson 20, easy 5, medium 10, hard 20, streak bonus).                        | BE    | Deterministic function with unit tests; documented in `docs/xp.md`.         |
| 7.3 | Streak calculation with grace (one missed day per week) and timezone correctness.            | BE    | DST-free Myanmar timezone tested; streak survives a 23:59 → 00:01 boundary. |
| 7.4 | Achievement unlock evaluation after each event.                                              | BE    | Each achievement has a test that unlocks exactly once.                      |
| 7.5 | `GET /progress/summary`, `/progress/daily`, `/achievements`.                                 | BE    | Weekly chart data matches `DailyActivity`.                                  |
| 7.6 | Mobile progress screen: weekly minutes, questions, accuracy, mastery movement, achievements. | MOB   | Shows "Algebra 62% → 78%", not just a streak.                               |
| 7.7 | Home daily-goal ring and streak chip from real data.                                         | MOB   | Completing a lesson advances the ring immediately.                          |
| 7.8 | **Do not** add leaderboards, gems, or loot boxes in v1.                                      | —     | Product review confirms no pay-to-win mechanics.                            |

---

## 16. Phase 8 — Admin application

**Goal:** Operate the product without touching the database.
**Duration:** 12 days · **Depends on:** Phase 1 (curriculum), Phase 9 parallel

| #    | Task                                                                                                                                                                         | Owner | Acceptance criteria                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| 8.1  | Scaffold: router, layout, auth guard, API client, React Query, error boundary, role check.                                                                                   | ADM   | Non-admin login is rejected; session refresh works.                                                                     |
| 8.2  | KYC queue: filters, pagination, document viewer via short-lived signed URLs, approve/reject with note, audit log.                                                            | ADM   | Reviewer can process 20 applications without a page reload; every action is audited.                                    |
| 8.3  | Curriculum authoring: subject/chapter/lesson CRUD, drag-reorder, markdown editor with live math preview, asset manager, publish/unpublish.                                   | ADM   | A non-developer can add a chapter and publish a lesson; equations render in the preview.                                |
| 8.4  | Bulk import UI with dry-run report and error download.                                                                                                                       | ADM   | Import 100 rows, see per-row status.                                                                                    |
| 8.4a | Content pipeline UI: source list with licence, page count, checksum; start import; import report (created/skipped/gaps/broken refs); coverage dashboard per subject/chapter. | ADM   | An operator can see that Physics has 13 empty chapters and that Chemistry is missing §1.1–1.4 without reading markdown. |
| 8.4b | Licence controls: set `SourceLicense` per source with note and attachment; publish is blocked for `REFERENCE_ONLY`.                                                          | ADM   | Attempting to publish a reference-only lesson shows the reason and refuses.                                             |
| 8.5  | User management: search, role change (audited), disable, KYC status.                                                                                                         | ADM   | Role change requires confirmation and writes `AuditLog`.                                                                |
| 8.6  | AI ops: usage and cost charts, top consumers, error rate, prompt version distribution.                                                                                       | ADM   | Matches backend `UsageLog` aggregates.                                                                                  |
| 8.7  | Content reports queue with message preview and action (dismiss / warn / disable).                                                                                            | ADM   | Report status transitions are audited.                                                                                  |
| 8.8  | Deploy as static SPA with auth; no secrets in the bundle.                                                                                                                    | ADM   | CSP, `X-Frame-Options`, and HTTPS-only cookies/tokens.                                                                  |

---

## 17. Phase 9 — Hardening & compliance

**Goal:** Make the system safe enough to put in front of minors and a public app store.
**Duration:** 12 days · **Depends on:** Phases 2–8 · **Runs in parallel with Phase 8**

### 17.1 Security

| #    | Task                                                                                                                                 | Owner  | Acceptance criteria                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| 9.1  | Secret management: all secrets in a managed store (Fly secrets / AWS SSM / Doppler); no `.env` in production images.                 | OPS    | Rotating a key requires no code change; audit trail of secret access.          |
| 9.2  | Token hardening: 15 min access TTL, refresh reuse detection revokes the session family, device metadata stored, logout-all verified. | BE     | Reusing a rotated refresh token revokes all sessions for that user and alerts. |
| 9.3  | Authorization matrix test: every route × every role, asserting expected 200/401/403/404.                                             | BE     | Table-driven test covers 100% of routes; CI fails on a new unlisted route.     |
| 9.4  | Rate limiting: per-IP and per-user on auth, AI, upload, and quiz routes.                                                             | BE     | 429 with `Retry-After`; brute-force OTP test blocked after 5 attempts.         |
| 9.5  | Input hardening: `forbidNonWhitelisted`, max lengths, SSRF-safe URL validation, no raw SQL.                                          | BE     | Fuzz test on DTOs produces 400, never 500.                                     |
| 9.6  | Upload security: magic-byte validation, size/page caps, EXIF strip, optional ClamAV scan, private bucket + signed reads only.        | BE/OPS | Malicious file rejected; bucket is not public.                                 |
| 9.7  | PII: encrypt KYC fields (already), encrypt `guardianPhone`, redact PII from logs and LLM prompts, add key-rotation runbook.          | BE     | Log scan finds no phone/email patterns; key rotation tested in staging.        |
| 9.8  | Dependency and secret scanning in CI (Dependabot/Renovate, `pnpm audit`, gitleaks, CodeQL).                                          | OPS    | No high/critical open at launch.                                               |
| 9.9  | Security headers, TLS/HSTS, CORS allowlist, CSP for admin, no `x-powered-by`.                                                        | OPS    | `securityheaders.com` grade A on admin; API passes header checks.              |
| 9.10 | Pen-test or structured OWASP ASVS L1 review; triage and fix all high findings.                                                       | OPS    | Report attached to release record.                                             |

### 17.2 Privacy & legal

| #    | Task                                                                                                                                  | Owner   | Acceptance criteria                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| 9.11 | Privacy policy, terms of service, AI-content disclaimer, and cookie/tracking disclosure.                                              | OPS     | Published URLs in both stores and in-app.                                                                               |
| 9.12 | **⚠ Decision D-MINORS:** define age policy (e.g. 13+ self-serve, under-13 requires guardian consent).                                 | OPS     | Policy implemented in signup and documented.                                                                            |
| 9.13 | Data deletion: `DELETE /auth/account` soft-deletes, a job erases PII and uploads within 30 days, and a confirmation email is sent.    | BE      | Deletion test verifies DB rows and storage objects are gone.                                                            |
| 9.14 | Data retention schedule: chats 12 months, uploads 30 days, usage logs 12 months, KYC per regulation.                                  | BE/OPS  | Cleanup jobs verified in staging.                                                                                       |
| 9.15 | AI provider DPA confirms no training on user data; document data residency.                                                           | OPS     | Signed DPA on file.                                                                                                     |
| 9.16 | Content licensing sign-off for all five G12 sources; confirm `SourceLicense` and attribution text matches what is shipped in the app. | CONTENT | Every `SourceDocument` has a licence record; published lessons from `REFERENCE_ONLY` sources are rewritten or withheld. |

### 17.3 Reliability

| #    | Task                                                                                                                                  | Owner | Acceptance criteria                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| 9.17 | Backups: daily automated + PITR; restore drill executed and timed.                                                                    | OPS   | Restore to a fresh DB in < 1 hour, documented.               |
| 9.18 | Graceful degradation: AI provider down → cached/fallback message; Redis down → fail open on quota but log; DB down → readiness fails. | BE    | Chaos test: kill Redis, chat still answers (with warning).   |
| 9.19 | Idempotency and retries for all mutations that cost money or write progress.                                                          | BE    | Duplicate requests produce one effect.                       |
| 9.20 | Load test: 200 concurrent chat streams, 100 quiz submits/s, 50 uploads/min.                                                           | OPS   | Meets §3.1 performance gates; identify the first bottleneck. |

---

## 18. Phase 10 — Staging, beta, launch

**Goal:** Ship, learn, and stay shippable.
**Duration:** 14 days · **Depends on:** Phases 8–9

| #     | Task                                                                                             | Owner | Acceptance criteria                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| 10.1  | Staging environment with production-like data volumes and synthetic users.                       | OPS   | One-command deploy; seeded test accounts for each role.                                                                       |
| 10.2  | Release candidate freeze; full regression run (manual script + Maestro).                         | QA    | All P0/P1 cases pass; known issues documented.                                                                                |
| 10.3  | TestFlight + Play internal testing with 10–20 users.                                             | OPS   | Crash-free ≥ 99%; no blocker bugs in 72 h.                                                                                    |
| 10.4  | Closed beta with 50–150 Myanmar Grade 12 students (the only grade with published content).       | OPS   | Feedback triaged daily; ≥60% of beta users complete one learning loop; content-gap reports triaged against the import report. |
| 10.5  | AI quality review on real beta conversations; fix top 5 failure modes; re-run evals.             | BE    | Eval pass rate ≥ 90%; no safety incidents.                                                                                    |
| 10.6  | Cost review: cost per active student-day, cost per conversation, margin at target price.         | OPS   | Within §3.1 gate; quota tuned.                                                                                                |
| 10.7  | Store submission: metadata, screenshots, preview video, privacy labels, age rating, support URL. | OPS   | Both stores approved or in review with no outstanding issues.                                                                 |
| 10.8  | Staged rollout: 10% → 50% → 100% over 7 days, with crash/error gates.                            | OPS   | Rollback rehearsed; on-call runbook active.                                                                                   |
| 10.9  | Launch comms: landing page, support inbox, status page, in-app changelog.                        | OPS   | Support response < 24 h.                                                                                                      |
| 10.10 | Post-launch week: daily metrics review, hotfix window, prompt tuning.                            | ALL   | No P0 for 7 days; retention and funnel baseline recorded.                                                                     |

---

## 19. Security & compliance

### 19.1 Threat model (top items)

| Threat                                                                    | Mitigation                                                                                                                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broken object-level authorization (IDOR) on conversations/uploads/quizzes | Every query scoped by `userId`; tests assert 404 for other users' resources                                                                                                 |
| Token theft / replay                                                      | Short access TTL, rotating refresh with reuse detection, SecureStore, logout-all                                                                                            |
| Prompt injection via uploaded homework or user text                       | Treat retrieved content as data, delimit it, never let it change system rules; output moderation                                                                            |
| PII leakage to LLM provider                                               | Redaction before send, DPA, no training, minimal retention                                                                                                                  |
| Malicious uploads                                                         | Magic-byte checks, private bucket, size caps, scanning, signed short-lived URLs                                                                                             |
| OTP abuse / enumeration                                                   | Per-email + per-IP throttle, generic responses, attempt caps                                                                                                                |
| Admin takeover                                                            | Role check, strict CORS, IP allowlist (staging), audit log, 2FA post-v1                                                                                                     |
| Cost abuse                                                                | Per-user quotas, per-IP throttles, anomaly alert on token spikes                                                                                                            |
| Minor safety                                                              | Age policy, content policy, report button, no public profiles, no DMs                                                                                                       |
| Copyright exposure from serving textbook text                             | `SourceLicense` enforced at publish and at serialisation; `REFERENCE_ONLY` sources never return verbatim body; attribution and page citations; legal sign-off before launch |

### 19.2 Data classification

| Class         | Examples                             | Handling                                                      |
| ------------- | ------------------------------------ | ------------------------------------------------------------- |
| Secret        | JWT secrets, KYC keys, provider keys | Secret manager, rotation, never logged                        |
| Sensitive PII | KYC doc number, guardian phone, DOB  | AES-256-GCM at rest, HMAC blind index, admin-only, audited    |
| Personal      | email, name, chat content, uploads   | Encrypted at rest (DB/object store), access-scoped, deletable |
| Operational   | usage logs, metrics                  | Pseudonymized user id, 12-month retention                     |

### 19.3 Compliance checklist

- [ ] Privacy policy and ToS published and linked in-app and in stores
- [ ] Age gate / guardian consent per D-MINORS decision
- [ ] Account deletion + data export path
- [ ] AI disclosure ("answers are generated and may be wrong")
- [ ] Provider DPA and no-training confirmation
- [ ] Curriculum licensing records for all five G12 sources, with attribution/“original content” notice visible in-app
- [ ] No `REFERENCE_ONLY` source is served verbatim (verified by a serialisation test)
- [ ] Store privacy labels / data safety forms accurate
- [ ] Incident response runbook + breach notification process

---

## 20. Post-v1 roadmap

Ordered by expected impact per unit of effort, to be re-ranked with beta data.

| Release | Feature                                           | Notes                                                                                                                               |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| v1.1    | Grade 10 and Grade 11 content                     | Same importer; needs source bundles that do not exist yet. Grade 11 first (adjacent cohort).                                        |
| v1.1    | Biology ingestion                                 | Absent from the current corpus; requires a Grade 12 Biology bundle and a chapter/lesson mapping before it can be offered.           |
| v1.1    | Physics and Chemistry completion                  | Replace TOC-only Physics and partial Chemistry with full bodies (author or re-extract) before marketing those subjects as complete. |
| v1.1    | Push notifications (streak, plan due, KYC result) | Requires `expo-notifications` + device token table                                                                                  |
| v1.1    | Mock exams + timed tests                          | Reuses quiz engine; adds `ExamTemplate` and a timer                                                                                 |
| v1.2    | PDF ingestion and "study this document"           | Extends upload/OCR; chunking + retrieval                                                                                            |
| v1.2    | Flashcards, summaries, mind maps                  | Generated artifacts from lesson/upload; new `GeneratedArtifact` model                                                               |
| v1.3    | Voice tutor (STT → tutor → TTS)                   | Highest-cost, highest-delight; needs streaming audio and latency work                                                               |
| v1.3    | Dedicated English tutor mode                      | Conversation practice, grammar correction, pronunciation scoring                                                                    |
| v1.4    | Parent dashboard                                  | `ParentStudentLink`, read-only weekly digest, no chat access                                                                        |
| v1.5    | Teacher/classroom (B2B)                           | Classrooms, assignments, class analytics, AI-assisted grading                                                                       |
| v2.0    | Offline lesson packs, web app, payments           | Only after retention proves willingness to pay                                                                                      |

**Explicitly deferred:** leaderboards, social feed, gamified currency, avatar marketplace, AI friend/companion features.

---

## 21. Testing & AI evaluation

### 21.1 Test pyramid

| Layer            | Tool                                          | Scope                                                          | Gate                                  |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Unit             | Vitest                                        | Services, algorithms (mastery, XP, grading, prompt builder)    | ≥70% lines on domain services         |
| Integration      | Vitest + Testcontainers Postgres/Redis        | Repositories, transactions, auth flows, quota                  | All green                             |
| E2E API          | Supertest                                     | Every v1 endpoint happy path + auth failures                   | 100% endpoint coverage                |
| Contract         | OpenAPI snapshot + generated client typecheck | No breaking change without version bump                        | Fails on drift                        |
| Mobile unit      | Jest + React Native Testing Library           | Hooks, reducers, formatting, error mapping                     | Key hooks covered                     |
| Mobile E2E       | Maestro                                       | Onboarding, lesson → chat, quiz → result, upload → homework    | Runs on iOS + Android in CI (nightly) |
| Load             | k6                                            | Chat SSE, quiz submit, upload                                  | §3.1 gates                            |
| AI eval          | Custom runner + LLM judge                     | 120-item golden set                                            | ≥90%, 0 safety failures               |
| Content pipeline | Vitest + fixture bundles                      | Normalizer, segmenter, math preservation, asset/link integrity | 100% of importer fixtures pass        |

### 21.2 Test data

- Deterministic factories for `User`, `Subject`, `Chapter`, `Lesson`, `Quiz`, `Attempt`.
- A `seed:test` script creates: 1 admin, 2 students (Grade 12), a 5-subject Grade 12 tree with one chapter and one published lesson per subject, 1 completed quiz, 1 weak topic.
- Content tests use small **fixtures**, not the real corpus: a 3-page synthetic GMS bundle covering a Burmese lesson, a Maths lesson with balanced `$$` blocks, and a lesson with a broken image ref. The full corpus is only imported in staging/CI content jobs.
- Every test isolates its data (transaction rollback or schema-per-worker).

### 21.3 Content pipeline tests

The corpus is imperfect, so the importer is tested at the seams rather than against "golden" full books.

| Test                  | Fixture                                                                      | Asserts                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Burmese round-trip    | Myanmar lesson excerpt                                                       | NFC-normalized, no zero-width spaces, tone marks intact, no mojibake after DB round-trip                      |
| Heading normalization | English `# UNIT 1` repeated, Maths `#### Example 1.`, Chemistry `Q 1 to Q 4` | Exactly one unit/chapter per real unit; `Example`/`Solution`/exercise groups never become lessons             |
| Math preservation     | Maths excerpt with `aligned`, `\text{}`, `<sub>`, display and inline math    | Equation count in = count out; delimiters balanced; KaTeX parses every block in CI                            |
| Page mapping          | TOC `page_id` + heading order                                                | `pageStart ≤ pageEnd`; no page beyond `SourceDocument.pageCount`; no negative ranges                          |
| Asset integrity       | Lesson with missing, empty, and valid image refs                             | Missing/empty refs → placeholder + report entry, never a dead URL; valid assets get stable keys and checksums |
| Idempotent import     | Same bundle imported twice                                                   | Zero duplicate chapters/lessons/assets; second run reports 0 created                                          |
| Licence enforcement   | Source with `license = REFERENCE_ONLY`                                       | Publish refused; public API never returns verbatim body                                                       |
| Gap detection         | Physics TOC-only, Chemistry partial                                          | Report lists 13 Physics chapters with no body and Chemistry's missing §1.1–1.4 / post-§2.3                    |
| Link checker          | Real corpus                                                                  | Baseline: 10 empty refs (9 Chemistry, 1 Maths), 0 missing files                                               |

### 21.4 Definition of done for any feature

1. Endpoint documented in Swagger with request/response examples.
2. Unit + integration + e2e tests.
3. Mobile screen with loading/empty/error/offline states.
4. Analytics event (if user-facing).
5. Sentry breadcrumb and structured log on failure paths.
6. Feature flag if the change is risky or user-visible.
7. Runbook note if it introduces a new failure mode.

---

## 22. Observability

### 22.1 Signals

| Signal                                         | Tool                                      | Retention                   |
| ---------------------------------------------- | ----------------------------------------- | --------------------------- |
| Errors + stack traces (backend, mobile, admin) | Sentry                                    | 90 days                     |
| Structured logs                                | pino → Better Stack / Datadog / Loki      | 30 days hot, 12 months cold |
| Traces                                         | OpenTelemetry → Grafana Tempo / Honeycomb | 7 days                      |
| Metrics                                        | Prometheus/Grafana or provider metrics    | 13 months                   |
| Product analytics                              | PostHog (self-host or cloud)              | 12 months                   |
| Uptime                                         | Better Stack / UptimeRobot                | —                           |

### 22.2 Required spans and metrics

- Spans: HTTP request, DB query (slow only), Redis, LLM call (model, tokens, latency, TTFT), OCR job, queue wait, content import (per book: chapters/lessons/assets created, gaps, duration).
- Metrics: request rate/errors/duration by route; p50/p95/p99; SSE active connections; TTFT; tokens in/out; cost/day; quota hits; queue depth; DB connections; cache hit rate; published lessons per subject; broken asset links; lessons with unbalanced math.
- Business metrics: DAU/WAU, onboarding completion, lessons opened, chats per user, quizzes completed, mastery delta, plan completion, D1/D7/D30 retention.

### 22.3 Alerts (page vs. ticket)

| Alert                       | Threshold                              | Action                    |
| --------------------------- | -------------------------------------- | ------------------------- |
| API 5xx rate                | >2% for 5 min                          | Page                      |
| p95 latency                 | >1 s for 10 min                        | Page                      |
| LLM error rate              | >5% for 10 min                         | Page                      |
| LLM TTFT p95                | >8 s for 10 min                        | Ticket → page if persists |
| Queue depth                 | >500 for 15 min                        | Ticket                    |
| DB connections              | >80% of max                            | Page                      |
| Readiness failing           | 2 consecutive checks                   | Page                      |
| Cost/day                    | >120% of 7-day average                 | Ticket                    |
| Crash-free sessions         | <99% over 1 h                          | Page                      |
| OTP failure spike           | >20% for 10 min                        | Ticket                    |
| Content import failed       | Any non-dry-run import ends `FAILED`   | Ticket                    |
| Broken lesson assets        | >0 over 24 h                           | Ticket                    |
| Published lesson regression | Published count drops >5% day-over-day | Page                      |

### 22.4 Logging rules

- One JSON line per request: `requestId`, `method`, `path` (no query PII), `status`, `durationMs`, `userId` (hashed), `ip` (hashed), `userAgent`.
- Never log: tokens, OTP codes (except the dev-only path), passwords, KYC fields, full prompts, full LLM responses. Log `conversationId`, token counts, and a truncated hash instead.
- Client-side: Sentry breadcrumbs for navigation and API failures; no chat content in breadcrumbs.

---

## 23. Infrastructure & environments

### 23.1 Environments

| Env          | Purpose              | Data                                     | Access              |
| ------------ | -------------------- | ---------------------------------------- | ------------------- |
| `local`      | Development          | Docker Postgres + Redis, seeded fixtures | Developer           |
| `staging`    | Pre-production, beta | Anonymized/synthetic + beta accounts     | Team + beta testers |
| `production` | Public               | Real                                     | Ops + on-call       |

Separate databases, buckets, and provider keys per environment. No production data in staging without anonymization.

### 23.2 Recommended stack (⚠ Decision D-HOSTING)

| Concern        | Recommended                                 | Alternatives                                    |
| -------------- | ------------------------------------------- | ----------------------------------------------- |
| API compute    | Fly.io (multi-region near Singapore)        | Render, Railway, AWS ECS Fargate, GCP Cloud Run |
| Postgres       | Neon or Supabase (managed, PITR, branching) | RDS, Cloud SQL                                  |
| Redis          | Upstash (serverless, per-request pricing)   | ElastiCache, Redis Cloud                        |
| Object storage | Cloudflare R2                               | S3, GCS                                         |
| Admin hosting  | Cloudflare Pages / Vercel                   | S3 + CloudFront                                 |
| Secrets        | Fly secrets / AWS SSM / Doppler             | 1Password CLI                                   |
| DNS/CDN        | Cloudflare                                  | Route 53                                        |

**Why not Kubernetes:** one small API and one worker do not justify the operational load. Use a PaaS with managed Postgres; revisit at >10k DAU.

### 23.3 Deployment topology

```
mobile ──► Cloudflare ──► API (2+ instances, stateless)
                              ├── Postgres (primary + PITR)
                              ├── Redis (queues, quota, cache)
                              ├── R2 (uploads)
                              └── LLM/OCR providers
         worker (1–2 instances) ── BullMQ consumers (OCR, quiz, plan, cleanup)
```

- SSE and long requests: disable proxy buffering, set idle timeout > 120 s, cap concurrent streams per instance.
- Workers scale independently; jobs are idempotent and retried with backoff.
- Migrations run as a release command **before** new instances take traffic, using expand/contract.

### 23.4 Backups & DR

- Postgres: daily snapshot + PITR (7–30 days depending on provider).
- Object storage: versioning on; lifecycle cleanup only for soft-deleted.
- Restore drill quarterly; record RTO/RPO (target RTO 1 h, RPO 15 min).
- Runbooks in `docs/runbooks/`: deploy, rollback, DB restore, provider outage, security incident, account deletion.

---

## 24. CI/CD & release engineering

### 24.1 Repository strategy

Keep three repos (they have independent release cadences), but add:

- A root `README.md` linking all three and this plan.
- Shared GitHub Actions templates copied per repo (or a `.github` repo with reusable workflows).
- `openapi.json` published from backend and consumed by mobile/admin.
- A single `docs/` folder at the root for runbooks, ADRs, eval reports, and release notes.
- A `content/` folder at the root for source bundles, the manifest, `QUALITY.md`, and the importer fixtures.

**Corpus storage:** the five bundles are ~14 MB today. Keep the markdown, `_meta.json`, and manifest in git (or Git LFS), and push page images to object storage as part of the import so the repo does not grow with duplicate assets. Never edit a bundle in place — add a new extraction version and re-import.

**⚠ Decision D-MONOREPO:** revisit a monorepo (pnpm workspace + Turborepo) only if cross-repo changes become weekly. Today they are not.

### 24.2 Backend pipeline

```
PR:    install → lint → typecheck → unit → integration (PG+Redis services)
       → e2e → openapi diff → content:lint → content:import --dry-run → build → docker build → trivy scan
main:  ... + push image → deploy staging → migrate → smoke → notify
tag:   ... + deploy production (manual approval) → migrate → smoke → rollback on fail
```

- `content:lint` runs the link checker, math-balance check, and duplicate-heading check against `content/sources/`; it fails on new empty refs or unbalanced `$$`.
- `content:import --dry-run` runs the importer against fixtures (not the full corpus) to catch segmentation regressions.

- Node version pinned; pnpm cache; `--frozen-lockfile`.
- Migration step is a separate job with a lock; it fails the deploy if migrations are pending and destructive.
- Smoke test: `/health/ready`, login with a synthetic user, one chat message with `MockProvider` disabled but a cheap model, one quiz fetch.
- Image is distroless/non-root; healthcheck defined.

### 24.3 Mobile pipeline

```
PR:    lint → tsc --noEmit → expo-doctor → jest
main:  EAS Update to `preview` channel (runtimeVersion-gated)
tag:   EAS Build (production) → EAS Submit → staged rollout
```

- `runtimeVersion` policy: `appVersion` (simple) or fingerprint (safer for native changes). Choose **fingerprint** if native deps change often.
- OTA updates only for JS-safe changes; any native/config change requires a store build.
- Store metadata and screenshots versioned in `store/` (fastlane-style) or EAS Metadata.
- Build numbers auto-increment (already configured in `eas.json`).

### 24.4 Admin pipeline

```
PR:    lint → typecheck → build → preview deploy (per-PR URL)
main:  build → deploy production → smoke (login, KYC list)
```

### 24.5 Versioning & branching

- Trunk-based: short-lived branches, squash merge, conventional commits.
- Backend API: `/v1`; additive changes only within v1; breaking changes require `/v2` and a deprecation window.
- Mobile: semver marketing version + monotonically increasing build number.
- Database: migration names timestamped; never edited after merge.
- Changelog generated from commits; release notes curated.

### 24.6 Rollback

| Layer         | Mechanism                                                   | Time       |
| ------------- | ----------------------------------------------------------- | ---------- |
| Backend       | Redeploy previous image; migrations are backward-compatible | < 5 min    |
| Mobile JS     | EAS Update rollback to previous update                      | < 15 min   |
| Mobile native | Halt rollout in stores; ship fix build                      | hours–days |
| Admin         | Redeploy previous static build                              | < 5 min    |
| Data          | Forward-fix migration; restore only as last resort          | hours      |

**Rule:** every release that touches the DB must be rollback-safe for at least one version (expand/contract).

---

## 25. Timeline & milestones

Assumes **solo, full-time, 5 days/week**, start **2026-11-02**. Content work (ingestion QA + Physics/Chemistry authoring) runs in parallel from week 1; it is the only part of the schedule that can slip without blocking engineering.

| Week  | Dates           | Phase       | Milestone                                                                                |
| ----- | --------------- | ----------- | ---------------------------------------------------------------------------------------- |
| 1–2   | Nov 2 – Nov 13  | Phase 0     | Blockers fixed, CI green, corpus moved + licence recorded, curriculum read/write shipped |
| 3–4   | Nov 16 – Nov 27 | Phase 1     | Ingested Grade 12 curriculum (5 subjects) + onboarding + lesson renderer live in staging |
| 5–7   | Nov 30 – Dec 18 | Phase 2     | Streaming tutor + Teach Me working on device                                             |
| 8–9   | Dec 21 – Jan 1  | Phase 3     | Photo → OCR → hint-first homework (1-week float into January)                            |
| 10–11 | Jan 4 – Jan 15  | Phase 4     | Quiz generation, attempts, grading, practice                                             |
| 12–13 | Jan 18 – Jan 29 | Phase 5     | Mastery, weaknesses, study plans                                                         |
| 14–15 | Feb 1 – Feb 12  | Phase 6     | All screens on real data, design/perf pass                                               |
| 16    | Feb 15 – Feb 19 | Phase 7     | Gamification and progress                                                                |
| 16–17 | Feb 15 – Feb 26 | Phase 8 + 9 | Admin app + hardening (parallel)                                                         |
| 18    | Mar 1 – Mar 5   | Phase 10    | Staging, beta cohort, store submission prep                                              |
| 19–20 | Mar 8 – Mar 22  | Phase 10    | Beta, store review, staged rollout, launch                                               |
| 21–22 | Mar 23 – Apr 2  | Buffer      | Contingency                                                                              |

**Milestones (go/no-go)**

| ID  | Date       | Criterion                                                                      |
| --- | ---------- | ------------------------------------------------------------------------------ |
| M0  | 2026-11-13 | Phase 0 exit; all defects closed; corpus checksummed and licence recorded      |
| M1  | 2026-11-27 | Grade 12 curriculum ingested and browsable; onboarding complete; maths renders |
| M2  | 2026-12-18 | Tutor + Teach Me demoable end to end, grounded in lesson content               |
| M3  | 2027-01-08 | Photo homework works                                                           |
| M4  | 2027-01-22 | Quiz + grading works                                                           |
| M5  | 2027-02-05 | Learning loop closed (mastery + plan)                                          |
| M6  | 2027-02-19 | Beta build in testers' hands                                                   |
| M7  | 2027-03-05 | Store submission                                                               |
| M8  | 2027-03-19 | Release candidate approved; staged rollout starts                              |
| M9  | 2027-03-22 | Public launch                                                                  |

**Exam sprint (only if the March matric window is a hard requirement).** A 12-week reduction that ships before the exam, at reduced scope:

- Launch **Myanmar, English, Mathematics** only; Physics and Chemistry show "coming soon".
- Tutor + Teach Me + quiz + mastery only; **no photo homework, no study plans, no gamification**.
- Admin limited to the KYC queue and a read-only content coverage view; content ships via the import CLI.
- Content rewritten or cleared for the three subjects by week 4 — this is the critical path, not engineering.
- Target **2027-01-25**; the full plan then resumes from week 12 as v1.1.

**Compression options if the full date slips:** launch 3 subjects (Myanmar/English/Maths) and defer Physics/Chemistry bodies to v1.1; ship chat + quiz + mastery before study plans; defer gamification; defer admin curriculum authoring (import CLI only) and keep the KYC queue.

**Expansion risks:** OCR quality for handwritten Burmese, math rendering fidelity, and the Physics/Chemistry content gap are the tasks most likely to consume the buffer. Only content work can be parallelised with a second person; the engineering track is serial.

---

## 26. Launch checklist

### 26.1 Product

- [ ] Onboarding works for a brand-new account on iOS and Android (Grade 12 only; other grades show "coming soon")
- [ ] Grade 12 curriculum browse + lesson content complete for the five launch subjects, with no empty published lesson
- [ ] Curriculum coverage page matches the import report (chapters/lessons/assets/gaps)
- [ ] Maths, Physics, and Chemistry equations render (no raw `$$`); 30 sampled equations verified per subject
- [ ] Burmese lessons render with correct font, line-height, and no zero-width artifacts
- [ ] Every published lesson has a licence record and a source/page footer
- [ ] 0 broken lesson asset links on a full crawl of published content
- [ ] Tutor streams, respects lesson scope, and switches language
- [ ] Teach Me completes the full loop and never leaks the answer early
- [ ] Photo upload → OCR → hint-first homework works on low-end Android
- [ ] Quiz generation, attempt, grading, and review work for all four types
- [ ] Mastery updates from attempts and shows honest confidence
- [ ] Study plan generates valid, grade-appropriate items
- [ ] Progress and streaks reflect real activity
- [ ] Account deletion works end to end

### 26.2 Backend

- [ ] 401/403 semantics verified across all routes
- [ ] Authorization matrix test covers every route
- [ ] Quotas and rate limits active
- [ ] All migrations applied to staging and production with backups
- [ ] `/health/ready` wired to the platform
- [ ] Graceful shutdown and connection draining verified
- [ ] Provider failover tested
- [ ] Backups restored in a drill within the last 90 days

### 26.3 Security & privacy

- [ ] No secrets in repo, image, or client bundle
- [ ] Dependency and secret scans clean
- [ ] Pen-test/ASVS findings closed or accepted
- [ ] PII redaction verified in logs and prompts
- [ ] Privacy policy, ToS, AI disclaimer live
- [ ] Age policy implemented
- [ ] Content licensing sign-off per subject; attribution/“original content” notice shown in-app
- [ ] Data retention jobs running

### 26.4 Mobile release

- [ ] `expo-doctor` clean; EAS production build succeeds
- [ ] Bundle ids, icons, splash, permission strings final
- [ ] iOS privacy manifest and Play data safety accurate
- [ ] Crash-free ≥ 99.5% in beta
- [ ] Deep links verified
- [ ] OTA channel and runtimeVersion configured
- [ ] Store listings, screenshots, preview video, keywords localized
- [ ] Support email and website live

### 26.5 Operations

- [ ] Dashboards for API, AI, queue, DB, business metrics
- [ ] Alerts routed and tested (send a fake page)
- [ ] Runbooks: deploy, rollback, restore, provider outage, incident, deletion
- [ ] On-call schedule (even if it is one person with a backup)
- [ ] Status page
- [ ] Cost alerts and budget
- [ ] Analytics funnel verified with a real device

### 26.6 Go/no-go

- [ ] All §3.1 release gates met
- [ ] No open P0/P1 bugs
- [ ] Rollback rehearsed in the last 7 days
- [ ] Beta feedback top-10 triaged
- [ ] Legal and content licensing signed off

---

## 27. Risks & mitigations

| #   | Risk                                                                                                      | Likelihood | Impact   | Mitigation                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Ministry copyright blocks verbatim use of the textbooks                                                   | High       | Critical | Resolve `D-CURRICULUM` in week 1–2; default to `REFERENCE_ONLY` (use the corpus for scope/eval, ship rewritten bodies); publish endpoint refuses unlicensed sources; legal sign-off in Phase 9 |
| R2  | Burmese tutor quality is poor                                                                             | Medium     | High     | 120-item eval set from week 3; native-speaker review; bilingual fallback; iterate prompts weekly                                                                                               |
| R3  | Handwritten Burmese/English OCR unreliable                                                                | High       | Medium   | LLM vision first; show editable transcription; allow "type instead"; cap expectations in UI                                                                                                    |
| R4  | AI cost exceeds price point                                                                               | Medium     | High     | Quotas from day one; measure cost/student from week 5; small model for non-tutoring tasks; prompt caching                                                                                      |
| R5  | LLM latency ruins chat UX                                                                                 | Medium     | High     | Streaming + TTFT SLO; region near users; provider failover; shorter max output                                                                                                                 |
| R6  | Solo developer bus factor                                                                                 | High       | High     | Document runbooks; keep infra simple; no bespoke platform; ADRs for every decision                                                                                                             |
| R7  | App store rejection (minors, AI, data)                                                                    | Medium     | High     | Pre-review guidelines; accurate privacy labels; age gate; AI disclaimer; appeal plan                                                                                                           |
| R8  | Security incident (PII, tokens)                                                                           | Low        | Critical | ASVS review, pen test, least privilege, audit logs, incident runbook, breach comms                                                                                                             |
| R9  | Scope creep into voice/parents/teachers                                                                   | High       | High     | This document is the scope contract; post-v1 table is the only intake path                                                                                                                     |
| R10 | Low-end Android performance                                                                               | Medium     | Medium   | Test on a 3 GB RAM device; virtualized lists; image compression; startup budget                                                                                                                |
| R11 | Provider outage or policy change                                                                          | Medium     | High     | Adapter interface + second provider; no vendor types in domain; contract tests                                                                                                                 |
| R12 | Low retention after launch                                                                                | Medium     | High     | Instrument funnel from day one; beta cohort; weekly "next best action"; study plans                                                                                                            |
| R13 | Exam-season traffic spike                                                                                 | Medium     | Medium   | Load test at 3× expected; autoscaling; queue-based OCR; graceful AI degradation                                                                                                                |
| R14 | Data loss                                                                                                 | Low        | Critical | PITR, backups, restore drills, soft deletes, no destructive migrations without backup                                                                                                          |
| R15 | Physics has **no body text** and Chemistry covers only 21 of its pages                                    | High       | High     | Treat TOC as the outline; author summaries in week 3–4; never publish an empty lesson; show "content coming soon" per subject in the app; re-extract from source PDFs as a fallback            |
| R16 | Naive segmentation creates hundreds of fake lessons from heading noise                                    | High       | Medium   | Normalizer + heuristics tested against fixtures; admin review queue before publish; coverage report vs TOC diff                                                                                |
| R17 | Math rendering breaks on mobile (KaTeX/WebView performance, `aligned`, `\text{}`)                         | Medium     | High     | Prototype the renderer in week 3, not week 14; CI parses every equation with KaTeX; native fallback for inline math; cap WebView instances                                                     |
| R18 | OCR extraction noise (repeated headers, duplicated `UNIT` headings, broken image refs, zero-width spaces) | High       | Medium   | Idempotent normalizer; `content:lint` baseline; 10 known empty refs replaced with placeholders; spot-check 20 lessons per subject                                                              |
| R19 | Burmese corpus size/font issues on low-end devices (726 KB markdown, long paragraphs)                     | Medium     | Medium   | Chunk into lessons of ≤4k tokens; lazy-load assets; test long passages on a 360 dp device                                                                                                      |

---

## 28. Open decisions

Each item has a recommendation and a deadline. Record the final choice as an ADR in `docs/adr/`.

| ID              | Decision                                                  | Recommendation                                                                                                                                                                                               | Needed by                               | Owner       |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------- |
| D-LLM           | Primary LLM provider and failover                         | OpenAI-compatible primary (GPT-class mid-tier) + one alternate adapter; keep model name in config                                                                                                            | Phase 2 start (week 5)                  | BE          |
| D-OCR           | OCR approach                                              | LLM vision for photos; provider OCR only if cost forces it                                                                                                                                                   | Phase 3 start (week 8)                  | BE          |
| D-HOSTING       | API/DB/Redis hosting                                      | Fly.io + Neon + Upstash + R2                                                                                                                                                                                 | Phase 0 (week 2)                        | OPS         |
| D-STORAGE       | Object storage                                            | Cloudflare R2                                                                                                                                                                                                | Phase 3 (week 8)                        | OPS         |
| D-CURRICULUM    | Rights to the five G12 textbook bundles                   | Formal written permission for verbatim redistribution; if not obtainable before week 2, set `REFERENCE_ONLY` and author original bodies against the official scope                                           | **Phase 0 (week 2) — blocks ingestion** | CONTENT/OPS |
| D-CONTENT-MODE  | Ship textbook text verbatim vs. rewritten original bodies | If permission is granted, ship verbatim with attribution and page citations. If not, ship original bodies that follow the official chapter/lesson scope and use the corpus only for eval and coverage checks | Phase 1 (week 3)                        | CONTENT     |
| D-ASSET-HOSTING | Where the ~330 textbook images live                       | R2 (or the main object store) under `g12/<subject>/<page>/<asset>` with checksums; never serve from the app bundle or repo                                                                                   | Phase 1 (week 3)                        | OPS         |
| D-MINORS        | Age policy and guardian consent                           | 13+ self-serve; under-13 blocked in v1, guardian flow post-v1                                                                                                                                                | Phase 9 (week 16)                       | OPS         |
| D-KYC           | Is KYC mandatory to use the app?                          | Optional for learning; required only for exam-registration or verified-student features                                                                                                                      | Phase 1 (week 3)                        | Product     |
| D-MONETIZATION  | Free/beta pricing and future model                        | Free closed beta; decide paid tiers after beta retention data                                                                                                                                                | Post-beta (week 18)                     | Product     |
| D-VOICE         | Voice scope                                               | Defer entirely to v1.3                                                                                                                                                                                       | Now                                     | Product     |
| D-PARENT        | Parent/teacher timing                                     | Defer to v1.4/v1.5                                                                                                                                                                                           | Now                                     | Product     |
| D-MONOREPO      | Merge repos into a monorepo                               | Keep separate for now; revisit at 10k DAU or weekly cross-repo changes                                                                                                                                       | Phase 0 (week 2)                        | OPS         |
| D-RUNTIME       | `runtimeVersion` policy                                   | Fingerprint if native deps churn; otherwise `appVersion`                                                                                                                                                     | Phase 6 (week 14)                       | MOB         |
| D-ANALYTICS     | Product analytics vendor                                  | PostHog Cloud (EU/self-host option)                                                                                                                                                                          | Phase 6 (week 14)                       | Product     |

---

## Appendix A — Phase dependency graph

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
                │                                  │           │
                │                                  └──► Phase 7 ┘
                └──────────────────► Phase 8 (admin)
                                        │
Phase 2..8 ─────────────────────────► Phase 9 (hardening)
                                        │
                                        ▼
                                   Phase 10 (launch)
```

## Appendix B — Immediate next actions (this week)

1. Resolve **D-HOSTING** and create staging accounts (Fly/Neon/Upstash/R2).
2. Resolve **D-CURRICULUM**: read the five copyright notices, ask for written permission, and decide verbatim vs. rewritten. Nothing else in the content track can start until this is answered.
3. Move the five `*GMS` bundles to `content/sources/g12/<subject>/` and write `content/manifest.json` with sha256 checksums. Commit (or LFS-track) them; they are currently untracked in the workspace root (`curriculum/`).
4. ~~Open a `phase-0` branch and fix D1, D2, D3, D4 with tests before anything else.~~ **Done 2026-11-15** — D1–D4, D7, D12, D13 fixed with four new spec files (see §2.6).
5. Commit the backend's uncommitted work; initialize git in `pyin-nyar-admin`. **Backend committed 2026-11-15; `pyin-nyar-admin` still has no git repo.**
6. Add `.env.example` files and the Zod env schema so a fresh clone boots.
7. Write `content/QUALITY.md` from §2.5: per-book gaps (Physics TOC-only, Chemistry pp. 20–40), 10 empty image refs, heading noise, page map.
8. Add CI skeletons so every subsequent PR is gated from day one, including the `content:lint` check.
9. Create `docs/adr/0001-llm-provider.md`, `0002-hosting.md`, and `0003-content-licensing.md`.

## Appendix C — Working agreements

- **No feature without a test.** A PR that adds an endpoint adds an e2e test; a PR that changes mastery adds a property test.
- **No `userId` from the body.** Identity comes from the token. Ever.
- **No prompt change without a version bump** and an eval run.
- **No destructive migration without a backup and a documented forward-fix.**
- **No new dependency without checking** whether an Expo/Nest/React built-in already does it.
- **No scope addition without moving something to post-v1.**
- **No content publish without a licence, a non-empty body, and a passing link check.**
- **Ship weekly to staging; ship to production only through the pipeline.**

## Appendix D — Corpus inventory and import baseline

Snapshot of the five Grade 12 bundles as received on 2026-10-30. Re-run `content:lint` after any re-extraction; this table is the expected baseline.

| Subject     | Bundle dir                       | Source pages   | Markdown | Words   | Headings | Assets | Equations          | Status                                   |
| ----------- | -------------------------------- | -------------- | -------- | ------- | -------- | ------ | ------------------ | ---------------------------------------- |
| Myanmar     | `1_G12 Myanmar Textbook GMS`     | 155            | 726 KB   | ~18,600 | 85       | 16     | 0                  | Complete body                            |
| English     | `2_G12 English Textbook GMS`     | 151            | 311 KB   | ~48,500 | 434      | 101    | 0                  | Complete: 12 units + 4 reviews + 4 poems |
| Mathematics | `3_G12 Mathematics Textbook GMS` | 220            | 289 KB   | ~51,900 | 271      | 194    | ~1,034 `$$` blocks | Complete: 11 chapters                    |
| Physics     | `4_G12 Physics Textbook GMS`     | 6 (of 249)     | 10 KB    | ~950    | 4        | 1      | 0                  | **TOC only** — 13 chapters, no bodies    |
| Chemistry   | `5_G12 Chemistry Textbook GMS`   | 21 (pp. 20–40) | 52 KB    | ~7,700  | 30       | 16     | ~71 `$$` blocks    | **Partial** — starts §1.5, ends mid-§2.3 |

Known defects to baseline in the first `content:lint` run:

| Defect                                                    | Count       | Location                                |
| --------------------------------------------------------- | ----------- | --------------------------------------- |
| Empty image refs `![]()`                                  | 10          | 9 Chemistry, 1 Maths                    |
| Missing image files                                       | 0           | —                                       |
| Duplicate unit headings                                   | 8           | English (`# UNIT 1`, `# UNIT` × 7 more) |
| Non-lesson headings (`Example`, `Solution`, `Q 1 to Q 4`) | many        | Maths, Chemistry                        |
| Missing bodies                                            | 13 chapters | Physics                                 |
| Missing page ranges                                       | 2 sections  | Chemistry (§1.1–1.4, post-§2.3)         |

**Expected import result (dry run, before content authoring):**

- Chapters: Myanmar section tree, English 12 units + 4 reviews + 4 poems, Maths 11, Physics 13 (empty), Chemistry 2 (partial).
- Lessons: ~350–450 records across the five books before noise filtering; expect ~250 published after review.
- Assets: ~330 files to upload; 10 placeholders.
- Publishable on day one: **Myanmar, English, Mathematics** (licence-dependent). Physics and Chemistry are **structure only** until bodies are authored.

**Per-subject notes**

- **Myanmar:** Surya OCR, 155 pages, no math. Section structure is `အပိုင်း` / `အခန်း`. Long prose paragraphs; watch line-height and zero-width spaces. 16 images.
- **English:** mixed `pdftext` + `surya`; heading noise is high (434 headings); unit bodies are clean. 101 images. Reviews and poems are separate lesson types.
- **Mathematics:** Surya OCR; ~1,034 display equations and 21 chapters' worth of `#### Example` / `#### Solution` headings. One `G-12 Math Figures.ai` file is a PDF, not an image — exclude it from the asset set.
- **Physics:** only front matter and the contents table. The TOC lists 13 chapters but chapters 7–9 have blank titles in the extraction. Needs re-extraction or authoring.
- **Chemistry:** starts at §1.5, has 9 empty image refs, and stops mid-§2.3. Exercise groups (`Q 1 to Q 4`) are promoted to `##` headings.

---

## Appendix E — Feature traceability (spec → plan)

[`FEATURE-SPEC.md`](./FEATURE-SPEC.md) owns the product definition. This appendix maps every spec feature to the phase that delivers it and records what exists in the code today. Update it when a phase ships or a spec section changes; §E.5 is the list of places the two documents still disagree.

### E.1 Core features (§4 of the spec)

| Spec | Feature                             | Delivered by                                                        | Status today                                                                   |
| ---- | ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| §4.1 | AI Tutor Chat                       | Phase 2 (§10)                                                       | Not started — `src/conversation` is DTOs only                                  |
| §4.2 | Guided teaching ("Teach Me")        | Phase 2 (§10, task 2.10)                                            | Not started — `TeachSession` is not modelled                                   |
| §4.3 | Homework & question helper          | Phase 3 (§11)                                                       | Not started — `Upload` model only                                              |
| §4.4 | Learning materials & document tutor | Post-v1 (§20, v1.2 PDF ingestion)                                   | Out of v1 — pasted text can ride Phase 3's extracted-text path                 |
| §4.5 | Quiz & practice generator           | Phase 4 (§12)                                                       | Not started — admin list/create only                                           |
| §4.6 | Progress & topic mastery            | Phase 5 (§13) + Phase 7 (§15)                                       | Not started — `MasteryScore` model only                                        |
| §4.7 | Personalized study plan             | Phase 5 (§13, tasks 5.5–5.6)                                        | Not started — `StudyPlan` / `StudyPlanItem` models only                        |
| §4.8 | Burmese & English support           | Phase 1 typography (§9.2, task 1.15) + Phase 2 prompt policy (§7.3) | Partial — `Language` enum on `User` and `Conversation`; no UI string catalogue |

### E.2 Cross-cutting requirements (§5 of the spec)

| Spec | Requirement                                         | Delivered by                                          | Status today                                                                 |
| ---- | --------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| §5.1 | Burmese-first onboarding, Unicode typography        | Phase 1 (§9.2, task 1.15); Phase 6 accessibility pass | Partial — Burmese strings are hardcoded per screen; no locale switching      |
| §5.2 | Mobile-first, low bandwidth, offline tolerance      | Phase 1 (task 1.20 cache) + Phase 6 (§14)             | Partial — typed client and single-flight refresh exist; no query persistence |
| §5.3 | Affordable access, limits shown before they are hit | §7.6 quotas, Phase 2 (task 2.7)                       | Not started                                                                  |
| §5.4 | Curriculum localisation and provenance              | Phase 1 (§9) ingestion + publish workflow             | Not started — corpus sits in the workspace, not in the repo                  |

### E.3 Later-phase and operational areas (§6–§10 of the spec)

| Spec | Area                                    | Plan decision                                                                                                  |
| ---- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| §6   | Voice tutor                             | Deferred to v1.3 (§20); non-goal in §3.2                                                                       |
| §7   | Parent view, teacher/classroom tools    | Deferred to v1.4/v1.5 (§20); non-goal in §3.2                                                                  |
| §8   | Gamification (goal, streak, XP, badges) | Phase 7 (§15); no leaderboards or paid currency                                                                |
| §9   | Admin & content management              | Phase 8 (§16); KYC review plus subject/chapter/lesson/quiz admin APIs already exist, admin UI is a placeholder |
| §10  | Safety, privacy, trust                  | Phase 9 (§17); only encrypted KYC PII exists today                                                             |

### E.4 MVP checklist mapping (§11 of the spec)

| §11 bucket | Item                                                                   | Plan location                   | Status                                        |
| ---------- | ---------------------------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| Must       | Burmese and English interface                                          | §9.2, §7.3                      | Partial (E.1 §4.8)                            |
| Must       | Student account and learner profile                                    | Shipped                         | Done — auth, profile read, lazy `Profile` row |
| Must       | AI tutor chat                                                          | Phase 2                         | Not started                                   |
| Must       | Guided "Teach Me"                                                      | Phase 2                         | Not started                                   |
| Must       | Text-based homework helper                                             | Phase 3                         | Not started                                   |
| Must       | Image upload + OCR with confirmation                                   | Phase 3 (tasks 3.4, 3.7)        | Not started                                   |
| Must       | Basic PDF/text learning support                                        | **Unassigned** — see E.5 gap 1  | Not started                                   |
| Must       | Quiz generation from topic or lesson                                   | Phase 4                         | Not started                                   |
| Must       | Answer explanations and mistake review                                 | Phase 4 (tasks 4.6, 4.9)        | Not started                                   |
| Must       | Basic learning history                                                 | Phase 4 (§6.6 attempts history) | Not started                                   |
| Must       | Basic topic-level progress                                             | Phase 5                         | Not started                                   |
| Must       | AI usage limits and cost monitoring                                    | Phase 2 (2.7) + Phase 8 (8.6)   | Not started                                   |
| Must       | Answer reporting and feedback                                          | Phase 2 (2.9)                   | Not started                                   |
| Must       | Privacy policy, terms, account deletion                                | Phase 9 (tasks 9.11, 9.13)      | Not started                                   |
| Should     | Study recommendations                                                  | Phase 5                         | Not started                                   |
| Should     | Flashcards, saved notes                                                | **Unassigned** — see E.5 gap 2  | Not started                                   |
| Should     | Daily practice                                                         | Phase 4 (task 4.7)              | Not started                                   |
| Should     | Offline access to cached materials                                     | Phase 1 (1.20) + Phase 6        | Not started                                   |
| Should     | Streak and daily goal                                                  | Phase 7                         | Not started                                   |
| Later      | Voice, exam simulation, parents, teachers, org plans, wider curriculum | §20 roadmap                     | Deferred by design                            |

### E.5 Known spec ↔ plan gaps

These are disagreements between the two documents, not implementation bugs. Close each by changing one of them:

1. **PDF/text material support is "must have" in §11 but v1.2 in §20.** Cheapest closure: Phase 3 already accepts extracted text (task 3.5), so allow pasted text there and record PDF as v1.2; otherwise move the item out of the must-have list.
2. **Flashcards and saved notes are "should have" in §11 but absent from §3.2's non-goals and unassigned in §20.** Add them to §3.2 or schedule them.
3. **Burmese-first navigation (§5.1) has no owner task.** The plan localises content language and Burmese glyph rendering (task 1.15) but never localises UI strings. Add a locale-catalogue task to Phase 1 or Phase 6.
4. **Question types differ.** §4.5 lists matching and step-by-step problem solving; §12 task 4.2 implements MCQ, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER. Record the four supported types in the spec or extend Phase 4.
5. **Learning-value metrics (§13) are not instrumented.** §22 covers latency, errors and cost, but not "improvement between initial and later assessments" or "repeat practice on weak topics". Add them to the Phase 5 analytics work.
