import { describe, expect, it } from "vitest";
import { GRADE_12_SUBJECTS } from "./catalog.js";
import type { SubjectDefinition } from "./catalog.js";
import { extractCurriculum } from "./extract.js";
import { normalizeTitle, parseTables, splitLines } from "./markdown.js";

function subject(code: string): SubjectDefinition {
  const found = GRADE_12_SUBJECTS.find((entry) => entry.code === code);
  if (!found) throw new Error(`unknown subject ${code}`);
  return found;
}

describe("markdown helpers", () => {
  it("strips OCR/HTML noise from titles", () => {
    expect(normalizeTitle("<b>CHAPTER 1</b>   ROTATIONAL MOTION ")).toBe(
      "CHAPTER 1 ROTATIONAL MOTION",
    );
    expect(normalizeTitle("Review {")).toBe("Review");
    expect(normalizeTitle("**GOOD MANNERS**")).toBe("GOOD MANNERS");
  });

  it("parses tables and keeps header separate from rows", () => {
    const lines = splitLines(
      ["| A | B |", "|---|---|", "| 1 | 2 |", "| 3 | 4 |"].join("\n"),
    );
    const [table] = parseTables(lines);
    expect(table.header).toEqual(["A", "B"]);
    expect(table.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });
});

describe("extractCurriculum", () => {
  it("reads maths chapters and nested lesson bodies", () => {
    const markdown = [
      "# Chapter 1",
      "",
      "## Complex Numbers",
      "",
      "### 1.1 Foo",
      "body one",
      "#### Example 1.",
      "example body",
      "",
      "### 1.2 Bar",
      "body two",
      "",
      "# Chapter 2",
      "",
      "## Induction",
      "",
      "### 2.1 Intro",
      "body three",
    ].join("\n");

    const chapters = extractCurriculum(subject("MATH"), markdown);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Complex Numbers",
      "Induction",
    ]);
    expect(chapters[0].lessons.map((lesson) => lesson.title)).toEqual([
      "1.1 Foo",
      "1.2 Bar",
    ]);
    expect(chapters[0].lessons[0].content).toContain("example body");
    expect(chapters[0].lessons[1].content).toBe("body two");
  });

  it("synthesises a chapter for orphan chemistry lessons", () => {
    const markdown = [
      "## 1.5 METALLIC BONDING",
      "body a",
      "",
      "## CHAPTER 2",
      "",
      "### ENERGY CHANGES IN CHEMICAL REACTIONS",
      "intro",
      "",
      "## 2.1 ENERGY CHANGES",
      "body b",
      "",
      "### 2.3 HESS'S LAW",
      "body c",
    ].join("\n");

    const chapters = extractCurriculum(subject("CHEM"), markdown);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Chapter 1",
      "Energy Changes In Chemical Reactions",
    ]);
    expect(chapters[0].lessons[0]).toMatchObject({
      title: "1.5 Metallic Bonding",
    });
    expect(chapters[1].lessons.map((lesson) => lesson.title)).toEqual([
      "2.1 Energy Changes",
      "2.3 Hess's Law",
    ]);
  });

  it("builds physics chapters from the table of contents only", () => {
    const markdown = [
      "| | PAGE |",
      "|---|---|",
      "| <b>CHAPTER 1 ROTATIONAL MOTION</b> | |",
      "| 1.1 ROTATIONAL MOTION UNDER CONSTANT ANGULAR ACCELERATION | 1 |",
      "| 1.2 RELATIONS BETWEEN LINEAR AND ANGULAR QUANTITIES | 4 |",
      "| SUMMARY | 11 |",
      "",
      "| CHAPTER 7 | APPLICATIONS OF LIGHT AND OPTICAL INSTRUMENTS | 99 |",
      "|---|---|---|",
      "| 7.1 | THE CAMERA | 99 |",
    ].join("\n");

    const chapters = extractCurriculum(subject("PHY"), markdown);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Chapter 1: Rotational Motion",
      "Chapter 7: Applications Of Light And Optical Instruments",
    ]);
    expect(chapters[0].lessons.map((lesson) => lesson.title)).toEqual([
      "1.1 Rotational Motion Under Constant Angular Acceleration",
      "1.2 Relations Between Linear And Angular Quantities",
    ]);
    expect(chapters[0].lessons[0].content).toBeNull();
  });

  it("reads english units from the toc and sections from the body", () => {
    const markdown = [
      "| UNIT | TOPIC | PAGE |",
      "|---|---|---|",
      "| Unit 1 | GOOD MANNERS | 1 |",
      "| REVIEW 1 | | 32 |",
      "| POEM 1 | THE LIBRARY | 33 |",
      "| Unit 2 | KEY TO HAPPINESS | 11 |",
      "",
      "# UNIT 1",
      "",
      "## READING",
      "",
      "# 1A Reading",
      "",
      "text a",
      "",
      "## lC Grammar",
      "",
      "text c",
      "",
      "# UNIT 2",
      "",
      "## 2A Reading",
      "",
      "text d",
      "",
      "## Review {",
      "",
      "review body",
      "",
      "# Poem 1: The Library",
      "",
      "poem body",
    ].join("\n");

    const chapters = extractCurriculum(subject("ENG"), markdown);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Unit 1: Good Manners",
      "Review 1",
      "Poem 1: The Library",
      "Unit 2: Key To Happiness",
    ]);
    expect(chapters[0].lessons.map((lesson) => lesson.title)).toEqual([
      "1A Reading",
      "1C Grammar",
    ]);
    expect(chapters[0].lessons[0].content).toBe("text a");
    expect(chapters[1].lessons[0].content).toBe("review body");
    expect(chapters[2].lessons[0].content).toBe("poem body");
  });

  it("reads myanmar chapters from prose markers and their contents tables", () => {
    const markdown = [
      "အခန်း - ၁။ စကားပြောရာတွင်ပါဝင်သောမွမ်းမံသံများ",
      "",
      "| စဉ် | အကြောင်းအရာ | စာမျက်နှာ |",
      "|-----|-------------|-----------|",
      "| ၁။  | အသံအနိမ့်အမြင့်သဘောတရား | ၁ |",
      "",
      "အခန်း - ၂။ အပြောအဆိုဆိုင်ရာနည်းလမ်းများ",
      "",
      "| ၁။ | ထိထိရောက်ရောက်စကားပြောဆိုခြင်း | ၇ |",
      "|----|--------------------------------|----|",
      "|----|--------------------------------|----|",
      "",
      "အခန်း - ၃။ မြန်မာပြဇာတ်ရွေးချယ်ချက်",
      "",
      "| ၁။ | ရေသည်ပြဇာတ် | ၁၀၅ |",
      "|----|-------------|-----|",
      "",
      "**အသံအနိမ့်အမြင့်သဘောတရား**",
      "",
      "body a",
    ].join("\n");

    const chapters = extractCurriculum(subject("MYA"), markdown);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "စကားပြောရာတွင်ပါဝင်သောမွမ်းမံသံများ",
      "အပြောအဆိုဆိုင်ရာနည်းလမ်းများ",
      "မြန်မာပြဇာတ်ရွေးချယ်ချက်",
    ]);
    expect(chapters[0].lessons[0].content).toBe("body a");
    expect(chapters[1].lessons.map((lesson) => lesson.title)).toEqual([
      "ထိထိရောက်ရောက်စကားပြောဆိုခြင်း",
    ]);
    expect(chapters[2].lessons.map((lesson) => lesson.title)).toEqual([
      "ရေသည်ပြဇာတ်",
    ]);
  });

  it("dedupes chapters/lessons that share a name", () => {
    const markdown = [
      "# Chapter 1",
      "",
      "## Duplicate",
      "",
      "### 1.1 Same",
      "a",
      "",
      "### 1.1 Same",
      "b",
    ].join("\n");

    const chapters = extractCurriculum(subject("MATH"), markdown);

    expect(chapters).toHaveLength(1);
    expect(chapters[0].lessons).toHaveLength(1);
  });
});
