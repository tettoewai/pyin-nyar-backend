/*
  D6 — Subject identity.

  `@@unique([name, code, grade])` could never enforce anything: Postgres treats
  every NULL as distinct, and both `code` and `grade` were nullable. Identity is
  now `(grade, code)`, both NOT NULL, so seed/import can be keyed on it and a
  rename no longer creates a second row for the same subject.

  Both checks abort the migration instead of guessing at data: choosing a code
  or grade for an existing row is a content decision, not a migration.
*/

DO $$
DECLARE
  null_rows integer;
  duplicate_pairs integer;
BEGIN
  SELECT count(*) INTO null_rows
  FROM "Subject"
  WHERE "code" IS NULL OR "grade" IS NULL;

  IF null_rows > 0 THEN
    RAISE EXCEPTION
      'Subject has % row(s) with NULL code or grade. Backfill first: SELECT id, name, code, grade FROM "Subject" WHERE code IS NULL OR grade IS NULL;',
      null_rows;
  END IF;

  SELECT count(*) INTO duplicate_pairs
  FROM (
    SELECT "grade", "code"
    FROM "Subject"
    GROUP BY "grade", "code"
    HAVING count(*) > 1
  ) AS dupes;

  IF duplicate_pairs > 0 THEN
    RAISE EXCEPTION
      'Subject has % duplicate (grade, code) pair(s). Merge or re-code first: SELECT grade, code, count(*), array_agg(name) FROM "Subject" GROUP BY grade, code HAVING count(*) > 1;',
      duplicate_pairs;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "grade" SET NOT NULL;

-- DropIndex
DROP INDEX "Subject_name_code_grade_key";

-- CreateIndex
CREATE UNIQUE INDEX "Subject_grade_code_key" ON "Subject"("grade", "code");
