/**
 * Demo data seeding.
 *
 * Seeds a realistic slice of app data on top of the curriculum so the mobile UI
 * can be wired to the backend and render every screen (subject grid, chats,
 * tests, recent results, progress, profile): demo users (teachers, parents,
 * students), profiles, KYC records in each status, a Biology subject
 * placeholder, teacher chat threads, quizzes with attempts, mastery scores,
 * study plans, uploads and usage logs.
 *
 * Everything uses deterministic ids (or the model's natural unique key) and
 * upserts, so re-running is idempotent. Rows are never pruned, so anything an
 * admin or tester edits by hand is preserved across runs.
 */
import * as argon2 from "argon2";
import type { SeedPrisma } from "./shared.js";
import { DEMO_PASSWORD, isDemoSeedEnabled } from "./shared.js";
import type { DemoSeedOptions } from "./shared.js";
import { seedKyc, seedUsers } from "./users.js";
import {
  ensureBiologySubject,
  loadTargets,
  seedConversations,
} from "./content.js";
import { seedAssessments, seedMastery } from "./assessments.js";
import { seedActivity } from "./activity.js";

export { isDemoSeedEnabled, DEMO_PASSWORD } from "./shared.js";
export type { DemoSeedOptions, DemoSeedLogger } from "./shared.js";

/** Subject codes whose ids are attached to demo KYC records. */
const PREFERRED_SUBJECT_CODES = ["MATH", "CHEM", "PHY"];

export async function seedDemoData(
  prisma: SeedPrisma,
  options: DemoSeedOptions = {},
): Promise<void> {
  const logger = options.logger ?? console;

  if (!isDemoSeedEnabled()) {
    logger.warn(
      "[demo] skipping demo data in production (set SEED_DEMO=true to override)",
    );
    return;
  }

  const passwordHash = await argon2.hash(options.password ?? DEMO_PASSWORD);

  // Biology is not in the corpus but the app's subject grid shows it.
  await ensureBiologySubject(prisma);

  const users = await seedUsers(prisma, passwordHash);
  const targets = await loadTargets(prisma);

  const preferredSubjectIds = PREFERRED_SUBJECT_CODES.map(
    (code) => targets.get(code)?.subjectId,
  ).filter((id): id is string => Boolean(id));

  await seedKyc(prisma, users, preferredSubjectIds, logger);
  await seedConversations(prisma, users, targets);
  await seedAssessments(prisma, users, targets);
  await seedMastery(prisma, users, targets);
  await seedActivity(prisma, users, targets);

  logger.info(
    `[demo] seeded ${users.size} users, ${targets.size} subject targets; ` +
      `login with any demo email and password "${options.password ?? DEMO_PASSWORD}"`,
  );
}
