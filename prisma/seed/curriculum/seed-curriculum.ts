import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PrismaClient } from "@/generated/prisma/client.js";
import { GRADE_12_SUBJECTS } from "./catalog.js";
import type { SubjectDefinition } from "./catalog.js";
import { extractCurriculum } from "./extract.js";

export interface SeedLogger {
  info(message: string): void;
  warn(message: string): void;
}

export interface CurriculumSeedOptions {
  /** Root folder holding the GMS bundles. Defaults to `CURRICULUM_DIR` or `../../curriculum`. */
  curriculumDir?: string;
  /** Override the subject list (handy for tests or a partial seed). */
  subjects?: SubjectDefinition[];
  logger?: SeedLogger;
}

export interface SubjectSeedResult {
  code: string;
  name: string;
  status: "seeded" | "skipped";
  chapters: number;
  lessons: number;
  reason?: string;
}

export interface CurriculumSeedResult {
  subjects: SubjectSeedResult[];
}

export function defaultCurriculumDir(): string {
  return (
    process.env.CURRICULUM_DIR ?? resolve(process.cwd(), "..", "curriculum")
  );
}

async function persistSubject(
  prisma: PrismaClient,
  subject: SubjectDefinition,
  chapters: ReturnType<typeof extractCurriculum>,
): Promise<{ chapters: number; lessons: number }> {
  const subjectRow = await prisma.subject.upsert({
    where: { grade_code: { grade: subject.grade, code: subject.code } },
    update: { name: subject.name, deletedAt: null },
    create: {
      name: subject.name,
      code: subject.code,
      grade: subject.grade,
    },
    select: { id: true },
  });

  let lessonCount = 0;

  for (const [chapterIndex, chapter] of chapters.entries()) {
    const chapterRow = await prisma.chapter.upsert({
      where: {
        subjectId_name: { subjectId: subjectRow.id, name: chapter.title },
      },
      update: { order: chapterIndex + 1, deletedAt: null },
      create: {
        subjectId: subjectRow.id,
        name: chapter.title,
        order: chapterIndex + 1,
      },
      select: { id: true },
    });

    for (const [lessonIndex, lesson] of chapter.lessons.entries()) {
      await prisma.lesson.upsert({
        where: {
          chapterId_name: { chapterId: chapterRow.id, name: lesson.title },
        },
        // Only overwrite a body when the importer actually recovered one, so a
        // re-run never clobbers hand-authored lesson content with `null`.
        update: {
          order: lessonIndex + 1,
          deletedAt: null,
          ...(lesson.content ? { content: lesson.content } : {}),
        },
        create: {
          chapterId: chapterRow.id,
          name: lesson.title,
          order: lessonIndex + 1,
          content: lesson.content,
        },
      });
      lessonCount += 1;
    }
  }

  return { chapters: chapters.length, lessons: lessonCount };
}

/**
 * Idempotent curriculum seed.
 *
 * Reads each subject's markdown from the curriculum folder, derives a
 * chapter/lesson tree, and upserts it keyed on the schema's natural unique
 * constraints (`(grade, code)`, `(subjectId, name)`, `(chapterId, name)`).
 * Running it twice produces the same row counts.
 */
export async function seedCurriculum(
  prisma: PrismaClient,
  options: CurriculumSeedOptions = {},
): Promise<CurriculumSeedResult> {
  const logger = options.logger ?? console;
  const curriculumDir = options.curriculumDir ?? defaultCurriculumDir();
  const subjects = options.subjects ?? GRADE_12_SUBJECTS;
  const results: SubjectSeedResult[] = [];

  for (const subject of subjects) {
    const filePath = resolve(curriculumDir, subject.file);

    if (!existsSync(filePath)) {
      logger.warn(
        `[curriculum] skipping ${subject.name}: ${filePath} not found. ` +
          `Set CURRICULUM_DIR to the folder containing the GMS bundles.`,
      );
      results.push({
        code: subject.code,
        name: subject.name,
        status: "skipped",
        chapters: 0,
        lessons: 0,
        reason: "source not found",
      });
      continue;
    }

    const markdown = await readFile(filePath, "utf8");
    const chapters = extractCurriculum(subject, markdown);

    if (chapters.length === 0) {
      logger.warn(
        `[curriculum] skipping ${subject.name}: no chapters found in ${filePath}`,
      );
      results.push({
        code: subject.code,
        name: subject.name,
        status: "skipped",
        chapters: 0,
        lessons: 0,
        reason: "no chapters extracted",
      });
      continue;
    }

    const counts = await persistSubject(prisma, subject, chapters);
    logger.info(
      `[curriculum] ${subject.name}: ${counts.chapters} chapters, ${counts.lessons} lessons`,
    );
    results.push({
      code: subject.code,
      name: subject.name,
      status: "seeded",
      chapters: counts.chapters,
      lessons: counts.lessons,
    });
  }

  return { subjects: results };
}
