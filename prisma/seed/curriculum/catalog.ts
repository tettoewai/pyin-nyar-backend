import { Grade } from "@/generated/prisma/enums.js";

/**
 * A subject that the curriculum importer knows how to read.
 *
 * `file` is relative to the curriculum source directory (the workspace-root
 * `curriculum/` folder by default). Paths are only resolved at seed time so the
 * backend can boot and test without the corpus present.
 */
export interface SubjectDefinition {
  name: string;
  /** Stable identity for `@@unique([grade, code])`, so renames are safe. */
  code: string;
  grade: Grade;
  file: string;
}

/** The five Grade 12 GMS bundles provided in the workspace `curriculum/` folder. */
export const GRADE_12_SUBJECTS: SubjectDefinition[] = [
  {
    name: "Myanmar",
    code: "MYA",
    grade: Grade.GRADE_12,
    file: "1_G12 Myanmar Textbook GMS/1_G12 Myanmar Textbook GMS.md",
  },
  {
    name: "English",
    code: "ENG",
    grade: Grade.GRADE_12,
    file: "2_G12 English Textbook GMS/2_G12 English Textbook GMS.md",
  },
  {
    name: "Mathematics",
    code: "MATH",
    grade: Grade.GRADE_12,
    file: "3_G12 Mathematics Textbook GMS/3_G12 Mathematics Textbook GMS.md",
  },
  {
    name: "Physics",
    code: "PHY",
    grade: Grade.GRADE_12,
    file: "4_G12 Physics Textbook GMS/4_G12 Physics Textbook GMS.md",
  },
  {
    name: "Chemistry",
    code: "CHEM",
    grade: Grade.GRADE_12,
    file: "5_G12 Chemistry Textbook GMS/5_G12 Chemistry Textbook GMS.md",
  },
];
