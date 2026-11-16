/**
 * Best-effort extraction of a `Subject -> Chapter -> Lesson` tree from the GMS
 * markdown bundles.
 *
 * The five textbooks are laid out differently (Maths uses `# Chapter n`, English
 * uses `# UNIT n` plus `nA Reading` sections, Physics ships a table of contents
 * with no body, Myanmar encodes chapters as prose markers + tables). Each
 * subject therefore gets a small, explicit strategy built from the shared
 * helpers in `markdown.ts`. Anything that cannot be recovered is left as a
 * `null` body rather than guessed; the schema allows empty lessons, and the
 * quality report in PLAN.md expects that for Physics and parts of Chemistry.
 */
import type { SubjectDefinition } from "./catalog.js";
import {
  buildHeadings,
  buildSectionIndex,
  cellText,
  findSection,
  headingEndLine,
  normalizeTitle,
  parseTables,
  sectionContent,
  sliceUntilBoundary,
  splitLines,
  stripTrailingPage,
} from "./markdown.js";
import type { HeadingEntry, MarkdownTable } from "./markdown.js";

export interface ExtractedLesson {
  title: string;
  content: string | null;
}

export interface ExtractedChapter {
  title: string;
  lessons: ExtractedLesson[];
}

const NUMBERED_LESSON_RE = /^(\d{1,2})\.(\d{1,2})[.)]?\s+(.+)$/;

interface NumberedLesson {
  chapter: number;
  title: string;
}

function parseNumberedLesson(title: string): NumberedLesson | null {
  const match = NUMBERED_LESSON_RE.exec(title);
  if (!match) return null;
  return { chapter: Number(match[1]), title };
}

function cleanLesson(title: string): string {
  return normalizeTitle(title)
    .replace(/\s*\.\s*$/, "")
    .trim();
}

function toBody(content: string): string | null {
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function titleCase(text: string): string {
  // Lowercase everything, then upper-case the first letter of each word. The
  // word pattern keeps apostrophes inside the word so "HESS'S" -> "Hess's"
  // rather than "Hess'S".
  return text
    .toLowerCase()
    .replace(/([a-z])([a-z']*)/g, (_match, first: string, rest: string) => {
      return `${first.toUpperCase()}${rest}`;
    });
}

function dedupeLessons(lessons: ExtractedLesson[]): ExtractedLesson[] {
  const seen = new Set<string>();
  const result: ExtractedLesson[] = [];
  for (const lesson of lessons) {
    if (!lesson.title || seen.has(lesson.title)) continue;
    seen.add(lesson.title);
    result.push(lesson);
  }
  return result;
}

function finalize(chapters: ExtractedChapter[]): ExtractedChapter[] {
  const seenChapters = new Set<string>();
  const result: ExtractedChapter[] = [];

  for (const chapter of chapters) {
    const lessons = dedupeLessons(chapter.lessons);
    if (lessons.length === 0) continue;

    let title = chapter.title.trim();
    if (seenChapters.has(title)) {
      let suffix = 2;
      while (seenChapters.has(`${title} (${suffix})`)) suffix += 1;
      title = `${title} (${suffix})`;
    }
    seenChapters.add(title);
    result.push({ title, lessons });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Maths + Chemistry: numbered chapters and `n.m` lesson headings.
// ---------------------------------------------------------------------------

const CHAPTER_HEADING_RE = /^Chapter\s+(\d+)$/i;

interface NumberedOptions {
  transformChapterTitle: (title: string) => string;
  transformLessonTitle: (title: string) => string;
}

function extractNumbered(
  lines: string[],
  options: NumberedOptions,
): ExtractedChapter[] {
  const headings = buildHeadings(lines);

  const chapterHeads = headings
    .map((heading) => {
      const match = CHAPTER_HEADING_RE.exec(heading.title);
      return match ? { heading, number: Number(match[1]) } : null;
    })
    .filter((entry): entry is { heading: HeadingEntry; number: number } =>
      Boolean(entry),
    );

  const lessonHeads = headings
    .map((heading) => {
      const parsed = parseNumberedLesson(heading.title);
      return parsed ? { heading, parsed } : null;
    })
    .filter(
      (entry): entry is { heading: HeadingEntry; parsed: NumberedLesson } =>
        Boolean(entry),
    );

  const boundaryLines = [
    ...new Set([
      ...chapterHeads.map((entry) => entry.heading.line),
      ...lessonHeads.map((entry) => entry.heading.line),
    ]),
  ].sort((a, b) => a - b);

  const resolveChapterTitle = (
    heading: HeadingEntry,
    number: number,
  ): string => {
    const nextChapterLine =
      chapterHeads.find((entry) => entry.heading.line > heading.line)?.heading
        .line ?? lines.length;

    const titleHeading = headings.find(
      (candidate) =>
        candidate.line > heading.line &&
        candidate.line < nextChapterLine &&
        candidate.level === heading.level + 1 &&
        parseNumberedLesson(candidate.title) === null &&
        !CHAPTER_HEADING_RE.test(candidate.title),
    );

    return options.transformChapterTitle(
      titleHeading?.title ?? `Chapter ${number}`,
    );
  };

  type Event =
    | { line: number; kind: "chapter"; number: number; heading: HeadingEntry }
    | { line: number; kind: "lesson"; number: number; heading: HeadingEntry };

  const events: Event[] = [
    ...chapterHeads.map((entry) => ({
      line: entry.heading.line,
      kind: "chapter" as const,
      number: entry.number,
      heading: entry.heading,
    })),
    ...lessonHeads.map((entry) => ({
      line: entry.heading.line,
      kind: "lesson" as const,
      number: entry.parsed.chapter,
      heading: entry.heading,
    })),
  ].sort((a, b) => a.line - b.line || (a.kind === "chapter" ? -1 : 1));

  const buckets = new Map<
    number,
    { title: string; synthetic: boolean; lessons: ExtractedLesson[] }
  >();
  const order: number[] = [];

  const ensureChapter = (number: number, title?: string) => {
    let bucket = buckets.get(number);
    if (!bucket) {
      bucket = {
        title: title ?? `Chapter ${number}`,
        synthetic: !title,
        lessons: [],
      };
      buckets.set(number, bucket);
      order.push(number);
    } else if (title && bucket.synthetic) {
      bucket.title = title;
      bucket.synthetic = false;
    }
    return bucket;
  };

  for (const event of events) {
    if (event.kind === "chapter") {
      ensureChapter(
        event.number,
        resolveChapterTitle(event.heading, event.number),
      );
      continue;
    }

    const bucket = ensureChapter(event.number);
    const content = sliceUntilBoundary(
      lines,
      event.heading.line,
      boundaryLines,
    );
    bucket.lessons.push({
      title: cleanLesson(options.transformLessonTitle(event.heading.title)),
      content: toBody(content),
    });
  }

  return finalize(
    order.map((number) => {
      const bucket = buckets.get(number)!;
      return { title: bucket.title, lessons: bucket.lessons };
    }),
  );
}

// ---------------------------------------------------------------------------
// Physics: table-of-contents only (no body text in the corpus).
// ---------------------------------------------------------------------------

const PHYSICS_CHAPTER_RE = /^CHAPTER\s+(\d+)\b[\s:.-]*(.*)$/i;

function extractPhysics(lines: string[]): ExtractedChapter[] {
  const tables = parseTables(lines);
  const buckets = new Map<number, ExtractedChapter>();
  const order: number[] = [];

  const ensureChapter = (number: number, title: string) => {
    let chapter = buckets.get(number);
    if (!chapter) {
      chapter = {
        title: title
          ? `Chapter ${number}: ${titleCase(title)}`
          : `Chapter ${number}`,
        lessons: [],
      };
      buckets.set(number, chapter);
      order.push(number);
    }
    return chapter;
  };

  for (const table of tables) {
    for (const row of [table.header, ...table.rows]) {
      const joined = row.map(cellText).filter(Boolean).join(" ");
      if (!joined) continue;

      const chapterMatch = PHYSICS_CHAPTER_RE.exec(joined);
      if (chapterMatch) {
        ensureChapter(
          Number(chapterMatch[1]),
          stripTrailingPage(chapterMatch[2] ?? ""),
        );
        continue;
      }

      const lesson = parseNumberedLesson(joined);
      if (!lesson) continue;

      const chapter = ensureChapter(lesson.chapter, "");
      chapter.lessons.push({
        title: titleCase(stripTrailingPage(lesson.title)),
        content: null,
      });
    }
  }

  return finalize(
    order.map((number) => {
      const chapter = buckets.get(number)!;
      return {
        title: chapter.title,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          title: cleanLesson(lesson.title),
        })),
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// English: 12 units + 4 reviews + 4 poems, with `nA..nE` sections as lessons.
// ---------------------------------------------------------------------------

interface EnglishSection {
  unit: number;
  label: string;
}

function parseEnglishSection(title: string): EnglishSection | null {
  const match = /^([0-9l]{1,2})\s?([A-E])\s+(.+)$/.exec(title);
  if (!match) return null;

  const digits = match[1].replace(/l/g, "1");
  const unit = Number(digits);
  if (!Number.isInteger(unit)) return null;

  return { unit, label: `${digits}${match[2]} ${match[3]}`.trim() };
}

function isAllCapsTitle(heading: HeadingEntry): boolean {
  return (
    heading.level === 1 &&
    /^[A-Z][A-Z0-9\s'&:?.,()!-]+$/.test(heading.title) &&
    heading.title.length > 2
  );
}

function headingSubtree(
  lines: string[],
  headings: HeadingEntry[],
  heading: HeadingEntry,
): string {
  const index = headings.indexOf(heading);
  if (index === -1) return "";
  const end = headingEndLine(headings, lines, index);
  return lines
    .slice(heading.line + 1, end)
    .join("\n")
    .trim();
}

function extractEnglish(lines: string[]): ExtractedChapter[] {
  const tables = parseTables(lines);
  const toc = tables.find((table) =>
    table.header.some((cell) => cellText(cell).toUpperCase() === "UNIT"),
  );
  if (!toc) return [];

  interface ChapterSeed {
    title: string;
    unit?: number;
  }

  const seeds: ChapterSeed[] = [];
  for (const row of toc.rows) {
    const label = cellText(row[0]);
    const topic = cellText(row[1]);

    const unit = /^Unit\s+(\d+)$/i.exec(label);
    if (unit) {
      seeds.push({
        title: `Unit ${unit[1]}: ${titleCase(topic)}`,
        unit: Number(unit[1]),
      });
      continue;
    }

    const review = /^Review\s+(\d+)$/i.exec(label);
    if (review) {
      seeds.push({ title: `Review ${review[1]}` });
      continue;
    }

    const poem = /^Poem\s+(\d+)$/i.exec(label);
    if (poem) {
      seeds.push({ title: `Poem ${poem[1]}: ${titleCase(topic)}` });
    }
  }

  if (seeds.length === 0) return [];

  const headings = buildHeadings(lines);
  const sectionHeads = headings
    .map((heading) => {
      const parsed = parseEnglishSection(heading.title);
      return parsed ? { heading, parsed } : null;
    })
    .filter(
      (entry): entry is { heading: HeadingEntry; parsed: EnglishSection } =>
        Boolean(entry),
    );

  const boundaryLines = [
    ...new Set([
      ...sectionHeads.map((entry) => entry.heading.line),
      ...headings
        .filter(
          (heading) =>
            /^UNIT\b/i.test(heading.title) ||
            /^Poem\b/i.test(heading.title) ||
            /^Review\b/i.test(heading.title) ||
            isAllCapsTitle(heading),
        )
        .map((heading) => heading.line),
    ]),
  ].sort((a, b) => a - b);

  const reviewHeadings = headings.filter((heading) =>
    /^Review\b/i.test(heading.title),
  );
  const poemHeadings = headings.filter((heading) =>
    /^Poem\s+\d+/i.test(heading.title),
  );

  let reviewCursor = 0;
  let poemCursor = 0;

  const chapters: ExtractedChapter[] = seeds.map((seed) => {
    if (seed.unit !== undefined) {
      const lessons = sectionHeads
        .filter((entry) => entry.parsed.unit === seed.unit)
        .map((entry) => ({
          title: cleanLesson(entry.parsed.label),
          content: toBody(
            sliceUntilBoundary(lines, entry.heading.line, boundaryLines),
          ),
        }));
      return { title: seed.title, lessons };
    }

    if (/^Review\b/i.test(seed.title)) {
      const heading = reviewHeadings[reviewCursor];
      reviewCursor += 1;
      return {
        title: seed.title,
        lessons: [
          {
            title: seed.title,
            content: heading
              ? toBody(headingSubtree(lines, headings, heading))
              : null,
          },
        ],
      };
    }

    const heading = poemHeadings[poemCursor];
    poemCursor += 1;
    return {
      title: seed.title,
      lessons: [
        {
          title: seed.title,
          content: heading
            ? toBody(headingSubtree(lines, headings, heading))
            : null,
        },
      ],
    };
  });

  return finalize(chapters);
}

// ---------------------------------------------------------------------------
// Myanmar: prose chapter markers followed by a contents table per chapter.
// ---------------------------------------------------------------------------

const MYANMAR_CHAPTER_RE = /^အခန်း\s*-\s*([၀-၉0-9]+)\s*[။.]\s*(.+)$/;

function isNoiseRow(cells: string[]): boolean {
  return cells.every((cell) => !cell || /^[-:\s]+$/.test(cell));
}

/** Some Myanmar contents tables omit a header row, so the first row can be real data. */
function isHeaderRow(cells: string[]): boolean {
  const first = cellText(cells[0]);
  const second = cellText(cells[1]);
  return first === "စဉ်" || second === "အကြောင်းအရာ" || second === "စာမျက်နှာ";
}

type MyanmarRow = string[];

function tableStartingAt(
  tables: MarkdownTable[],
  line: number,
): MarkdownTable | undefined {
  return tables.find((table) => table.startLine === line);
}

function extractMyanmar(lines: string[]): ExtractedChapter[] {
  const tables = parseTables(lines);
  const markers: { line: number; title: string }[] = [];

  for (let line = 0; line < lines.length; line++) {
    const match = MYANMAR_CHAPTER_RE.exec(lines[line].trim());
    if (match) markers.push({ line, title: normalizeTitle(match[2]) });
  }

  if (markers.length === 0) return [];

  const sectionIndex = buildSectionIndex(lines);

  const chapters: ExtractedChapter[] = markers.map((marker) => {
    let cursor = marker.line + 1;
    while (cursor < lines.length && lines[cursor].trim() === "") cursor += 1;

    const table = tableStartingAt(tables, cursor);
    const lessons: ExtractedLesson[] = [];
    const rows: MyanmarRow[] = table ? [table.header, ...table.rows] : [];

    for (const row of rows) {
      if (isNoiseRow(row) || isHeaderRow(row)) continue;
      const title = cleanLesson(cellText(row[1]) || cellText(row[0]));
      if (!title || /^[၀-၉0-9]+$/.test(title)) continue;

      const section = findSection(sectionIndex, title);
      lessons.push({
        title,
        content: section ? toBody(sectionContent(lines, section)) : null,
      });
    }

    return { title: marker.title, lessons };
  });

  return finalize(chapters);
}

// ---------------------------------------------------------------------------

export function extractCurriculum(
  subject: SubjectDefinition,
  markdown: string,
): ExtractedChapter[] {
  const lines = splitLines(markdown);

  switch (subject.code) {
    case "MATH":
      return extractNumbered(lines, {
        transformChapterTitle: (title) => title,
        transformLessonTitle: (title) => title,
      });
    case "CHEM":
      return extractNumbered(lines, {
        transformChapterTitle: (title) => titleCase(title),
        transformLessonTitle: (title) => titleCase(title),
      });
    case "PHY":
      return extractPhysics(lines);
    case "ENG":
      return extractEnglish(lines);
    case "MYA":
      return extractMyanmar(lines);
    default:
      return [];
  }
}
