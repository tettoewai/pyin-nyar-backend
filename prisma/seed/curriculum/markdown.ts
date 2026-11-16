/**
 * Small, dependency-free markdown helpers used by the curriculum importer.
 *
 * The GMS corpus was produced by an OCR/extraction pipeline, so the markdown is
 * noisy: HTML tags (`<b>`, `<sub>`), trailing `{`, duplicated headings, and
 * emphasis used where headings were intended. These helpers normalize just
 * enough of that noise to recover a chapter/lesson tree without pulling in a
 * full markdown parser.
 */

export interface HeadingEntry {
  level: number;
  title: string;
  line: number;
}

export interface SectionEntry {
  title: string;
  line: number;
  endLine: number;
}

export interface MarkdownTable {
  header: string[];
  rows: string[][];
  startLine: number;
}

const HEADING_RE = /^(#{1,6})[ \t]+(.*?)[ \t]*$/;
const BOLD_LINE_RE = /^\*\*(.+?)\*\*[ \t]*$/;

export function splitLines(markdown: string): string[] {
  return markdown.split(/\r?\n/);
}

/**
 * Collapse OCR/formatting noise in a heading or table cell so titles can be
 * compared and safely used as unique chapter/lesson names.
 */
export function normalizeTitle(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_`]/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s*\{\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildHeadings(lines: string[]): HeadingEntry[] {
  const headings: HeadingEntry[] = [];
  let inFence = false;

  for (let line = 0; line < lines.length; line++) {
    const text = lines[line];
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = HEADING_RE.exec(text);
    if (!match) continue;

    headings.push({
      level: match[1].length,
      title: normalizeTitle(match[2]),
      line,
    });
  }

  return headings;
}

/**
 * Line index where a heading's subtree ends, i.e. the next heading at the same
 * or a shallower level. Returns `lines.length` when the heading runs to EOF.
 */
export function headingEndLine(
  headings: HeadingEntry[],
  lines: string[],
  index: number,
): number {
  const heading = headings[index];
  for (let next = index + 1; next < headings.length; next++) {
    if (headings[next].level <= heading.level) return headings[next].line;
  }
  return lines.length;
}

/** A flat, line-ordered index of headings and standalone bold lines. */
export function buildSectionIndex(lines: string[]): SectionEntry[] {
  const headings = buildHeadings(lines);
  const ends = new Map<number, number>();
  headings.forEach((heading, index) => {
    ends.set(heading.line, headingEndLine(headings, lines, index));
  });

  const entries: { title: string; line: number; end: number }[] = headings.map(
    (heading) => ({
      title: heading.title,
      line: heading.line,
      end: ends.get(heading.line) ?? lines.length,
    }),
  );

  for (let line = 0; line < lines.length; line++) {
    const match = BOLD_LINE_RE.exec(lines[line].trim());
    if (!match) continue;
    const title = normalizeTitle(match[1]);
    if (title) entries.push({ title, line, end: lines.length });
  }

  entries.sort((a, b) => a.line - b.line);

  return entries.map((entry, index) => {
    const next = entries[index + 1];
    // Bold lines have no heading level, so cap them at the next indexed entry;
    // headings keep their (nested) subtree end.
    const endLine = next ? Math.min(entry.end, next.line) : entry.end;
    return { title: entry.title, line: entry.line, endLine };
  });
}

export function findSection(
  index: SectionEntry[],
  title: string,
): SectionEntry | undefined {
  const wanted = normalizeTitle(title);
  if (!wanted) return undefined;

  return (
    index.find((entry) => entry.title === wanted) ??
    index.find(
      (entry) =>
        entry.title.startsWith(wanted) || wanted.startsWith(entry.title),
    ) ??
    index.find((entry) => entry.title.includes(wanted))
  );
}

export function sectionContent(lines: string[], section: SectionEntry): string {
  return lines
    .slice(section.line + 1, section.endLine)
    .join("\n")
    .trim();
}

/**
 * Texts from just after `startLine` up to the next boundary in `boundaries`
 * (assumed ascending). Used where a heading's own subtree is unreliable, such
 * as English lessons whose headings are all at level 1.
 */
export function sliceUntilBoundary(
  lines: string[],
  startLine: number,
  boundaries: number[],
): string {
  const end = boundaries.find((line) => line > startLine) ?? lines.length;
  return lines
    .slice(startLine + 1, end)
    .join("\n")
    .trim();
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|");
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("-") && /^\|?[\s:|-]+\|?$/.test(trimmed);
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseTables(lines: string[]): MarkdownTable[] {
  const tables: MarkdownTable[] = [];

  for (let line = 0; line < lines.length - 1; line++) {
    if (!isTableRow(lines[line]) || !isSeparatorRow(lines[line + 1])) continue;

    const header = splitCells(lines[line]);
    const rows: string[][] = [];

    let cursor = line + 2;
    for (; cursor < lines.length; cursor++) {
      if (!isTableRow(lines[cursor])) break;
      if (isSeparatorRow(lines[cursor])) continue;
      rows.push(splitCells(lines[cursor]));
    }

    tables.push({ header, rows, startLine: line });
    line = cursor - 1;
  }

  return tables;
}

export function cellText(cell: string | undefined): string {
  return normalizeTitle(cell ?? "");
}

/** Strip a trailing page number that the OCR appended to a table-derived title. */
export function stripTrailingPage(title: string): string {
  return title.replace(/\s+\d+\s*$/, "").trim();
}
