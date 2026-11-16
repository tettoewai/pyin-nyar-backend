/** Shared constants and types for the demo seed. */
import type { PrismaClient } from "@/generated/prisma/client.js";

export interface DemoSeedLogger {
  info(message: string): void;
  warn(message: string): void;
}

export interface DemoSeedOptions {
  logger?: DemoSeedLogger;
  /** Override the shared demo password (defaults to `Passw0rd!`). */
  password?: string;
}

export const DEMO_PASSWORD = "Passw0rd!";

/** Deterministic id helper so re-running the seed upserts instead of duplicating. */
export function sid(...parts: (string | number)[]): string {
  return ["seed", ...parts.map((part) => String(part).toLowerCase())].join("_");
}

/**
 * Demo accounts should not leak into production. Explicit opt-in via
 * `SEED_DEMO=true` is required when `NODE_ENV=production`.
 */
export function isDemoSeedEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV !== "production" || env.SEED_DEMO === "true";
}

export interface LearningTarget {
  subjectId: string;
  subjectCode: string;
  chapterId: string | null;
  chapterTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
}

export type TargetMap = Map<string, LearningTarget>;

export type SeedPrisma = PrismaClient;

/** Coarse "days ago" helper for believable timestamps. */
export function daysAgo(days: number, hours = 0): Date {
  return new Date(
    Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000,
  );
}
