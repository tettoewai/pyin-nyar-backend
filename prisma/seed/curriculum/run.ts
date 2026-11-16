/**
 * Curriculum seed CLI.
 *
 *   pnpm db:seed:curriculum              # importer + DB upsert
 *   pnpm db:seed:curriculum --dry-run    # parse only, print a coverage report
 *
 * `--dry-run` needs no database and is the quickest way to sanity-check the
 * importer against the corpus after editing a parser.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client.js";
import { GRADE_12_SUBJECTS } from "./catalog.js";
import type { SubjectDefinition } from "./catalog.js";
import { extractCurriculum } from "./extract.js";
import { defaultCurriculumDir, seedCurriculum } from "./seed-curriculum.js";

interface ParsedArgs {
  dryRun: boolean;
  subject?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { dryRun: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--subject=")) {
      args.subject = arg.slice("--subject=".length).toUpperCase();
    }
  }
  return args;
}

function selectSubjects(filter?: string): SubjectDefinition[] {
  if (!filter) return GRADE_12_SUBJECTS;
  return GRADE_12_SUBJECTS.filter((subject) => subject.code === filter);
}

async function dryRun(subjects: SubjectDefinition[], curriculumDir: string) {
  let totals = { chapters: 0, lessons: 0, withContent: 0 };

  for (const subject of subjects) {
    const filePath = resolve(curriculumDir, subject.file);
    if (!existsSync(filePath)) {
      console.warn(`skip ${subject.code}: not found at ${filePath}`);
      continue;
    }

    const markdown = await readFile(filePath, "utf8");
    const chapters = extractCurriculum(subject, markdown);
    const lessons = chapters.flatMap((chapter) => chapter.lessons);
    const withContent = lessons.filter((lesson) => lesson.content).length;

    totals = {
      chapters: totals.chapters + chapters.length,
      lessons: totals.lessons + lessons.length,
      withContent: totals.withContent + withContent,
    };

    console.log(
      `${subject.code.padEnd(5)} ${String(chapters.length).padStart(3)} chapters  ` +
        `${String(lessons.length).padStart(4)} lessons  ` +
        `${String(withContent).padStart(4)} with body`,
    );
    for (const chapter of chapters) {
      console.log(`      - ${chapter.title} (${chapter.lessons.length})`);
    }
  }

  console.log(
    `\ntotal: ${totals.chapters} chapters, ${totals.lessons} lessons, ` +
      `${totals.withContent} with body`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const curriculumDir = defaultCurriculumDir();
  const subjects = selectSubjects(args.subject);

  if (args.dryRun) {
    await dryRun(subjects, curriculumDir);
    return;
  }

  const pool = new Pool({ connectionString: `${process.env.DATABASE_URL}` });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const result = await seedCurriculum(prisma, {
      curriculumDir,
      subjects,
    });
    const seeded = result.subjects.filter((entry) => entry.status === "seeded");
    console.log(`\nseeded ${seeded.length}/${result.subjects.length} subjects`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
