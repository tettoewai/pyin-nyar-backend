/**
 * Demo quizzes, question banks, quiz attempts/answers and mastery scores.
 *
 * These back the app's "Tests", "Recent Results" and subject progress surfaces.
 */
import {
  AttemptStatus,
  Difficulty,
  MasteryScope,
  QuestionType,
} from "@/generated/prisma/client.js";
import type { SeedPrisma, TargetMap } from "./shared.js";
import { daysAgo, sid } from "./shared.js";

interface QuestionSeed {
  key: string;
  type: QuestionType;
  question: string;
  options?: { id: string; text: string }[];
  answer: string;
  explanation: string;
}

interface AttemptSeed {
  student: string;
  status: AttemptStatus;
  /** Question keys the student answered incorrectly. */
  wrong?: string[];
  /** For in-progress/abandoned attempts: which questions were answered. */
  answeredKeys?: string[];
  startedAt: Date;
  completedAt?: Date;
}

interface QuizSeed {
  key: string;
  subjectCode: string;
  title: string;
  difficulty: Difficulty;
  questions: QuestionSeed[];
  attempts: AttemptSeed[];
}

function mcq(
  key: string,
  question: string,
  options: [string, string, string, string],
  answer: string,
  explanation: string,
): QuestionSeed {
  return {
    key,
    type: QuestionType.MCQ,
    question,
    options: options.map((text, index) => ({
      id: "ABCD"[index],
      text,
    })),
    answer,
    explanation,
  };
}

function trueFalse(
  key: string,
  question: string,
  answer: "TRUE" | "FALSE",
  explanation: string,
): QuestionSeed {
  return {
    key,
    type: QuestionType.TRUE_FALSE,
    question,
    options: [
      { id: "TRUE", text: "True" },
      { id: "FALSE", text: "False" },
    ],
    answer,
    explanation,
  };
}

function fillBlank(
  key: string,
  question: string,
  answer: string,
  explanation: string,
): QuestionSeed {
  return {
    key,
    type: QuestionType.FILL_BLANK,
    question,
    answer,
    explanation,
  };
}

const QUIZZES: QuizSeed[] = [
  {
    key: "math-complex",
    subjectCode: "MATH",
    title: "Complex Numbers — Quick Check",
    difficulty: Difficulty.EASY,
    questions: [
      mcq(
        "1",
        "What is the value of i squared?",
        ["1", "-1", "0", "i"],
        "B",
        "The imaginary unit is defined by i² = -1.",
      ),
      mcq(
        "2",
        "What is the modulus of z = 3 + 4i?",
        ["5", "7", "25", "1"],
        "A",
        "|z| = √(3² + 4²) = 5.",
      ),
      trueFalse(
        "3",
        "Every real number is also a complex number.",
        "TRUE",
        "A real number x is the complex number x + 0i.",
      ),
      fillBlank(
        "4",
        "If z = 2 − 3i, what is its conjugate?",
        "2+3i",
        "The conjugate flips the sign of the imaginary part.",
      ),
      mcq(
        "5",
        "Which are the solutions of x² + 2x + 5 = 0?",
        ["-1 ± 2i", "1 ± 2i", "-1 ± i", "2 ± i"],
        "A",
        "(x + 1)² = -4, so x = -1 ± 2i.",
      ),
    ],
    attempts: [
      {
        student: "student.aungmin",
        status: AttemptStatus.COMPLETED,
        wrong: ["3"],
        startedAt: daysAgo(0, 4),
        completedAt: daysAgo(0, 3),
      },
      {
        student: "student.sumyat",
        status: AttemptStatus.COMPLETED,
        wrong: ["1", "4"],
        startedAt: daysAgo(1, 2),
        completedAt: daysAgo(1, 1),
      },
    ],
  },
  {
    key: "physics-rotation",
    subjectCode: "PHY",
    title: "Rotational Motion — Chapter Test",
    difficulty: Difficulty.MEDIUM,
    questions: [
      mcq(
        "1",
        "What is the SI unit of angular acceleration?",
        ["rad/s²", "m/s²", "rad/s", "N"],
        "A",
        "Angular acceleration is measured in radians per second squared.",
      ),
      mcq(
        "2",
        "Centripetal acceleration always points…",
        [
          "toward the centre",
          "away from the centre",
          "along the tangent",
          "upward",
        ],
        "A",
        "It points toward the centre of the circular path.",
      ),
      trueFalse(
        "3",
        "In uniform circular motion the speed is constant.",
        "TRUE",
        "Only the direction changes, so the speed is constant.",
      ),
      fillBlank(
        "4",
        "For circular motion, v = r × ___.",
        "ω",
        "Linear speed equals radius times angular velocity.",
      ),
    ],
    attempts: [
      {
        student: "student.aungmin",
        status: AttemptStatus.COMPLETED,
        wrong: ["2"],
        startedAt: daysAgo(1, 5),
        completedAt: daysAgo(1, 4),
      },
      {
        student: "student.kyaw",
        status: AttemptStatus.ABANDONED,
        answeredKeys: ["1"],
        startedAt: daysAgo(2, 6),
      },
    ],
  },
  {
    key: "chem-energy",
    subjectCode: "CHEM",
    title: "Energy Changes — Practice",
    difficulty: Difficulty.EASY,
    questions: [
      mcq(
        "1",
        "An exothermic reaction…",
        [
          "releases heat",
          "absorbs heat",
          "has no energy change",
          "only occurs in water",
        ],
        "A",
        "Exothermic reactions release energy to the surroundings.",
      ),
      mcq(
        "2",
        "Hess's law is used to find…",
        ["enthalpy change", "molar mass", "pH", "density"],
        "A",
        "Hess's law lets you sum enthalpy changes over a path.",
      ),
      trueFalse(
        "3",
        "Breaking bonds releases energy.",
        "FALSE",
        "Breaking bonds absorbs energy; forming bonds releases it.",
      ),
      fillBlank(
        "4",
        "ΔH = H(products) − ___.",
        "H(reactants)",
        "Enthalpy change is products minus reactants.",
      ),
    ],
    attempts: [
      {
        student: "student.aungmin",
        status: AttemptStatus.IN_PROGRESS,
        answeredKeys: ["1", "2"],
        startedAt: daysAgo(0, 1),
      },
      {
        student: "student.sumyat",
        status: AttemptStatus.COMPLETED,
        wrong: ["3"],
        startedAt: daysAgo(2, 3),
        completedAt: daysAgo(2, 2),
      },
    ],
  },
  {
    key: "eng-manners",
    subjectCode: "ENG",
    title: "Good Manners — Unit Test",
    difficulty: Difficulty.EASY,
    questions: [
      mcq(
        "1",
        "Which modal shows strong obligation?",
        ["must", "can", "might", "could"],
        "A",
        "'Must' expresses strong obligation.",
      ),
      mcq(
        "2",
        "Which of these is a compound noun?",
        ["bus stop", "quickly", "very", "and"],
        "A",
        "'Bus stop' is made of two nouns.",
      ),
      trueFalse(
        "3",
        "'Should' is often used to give advice.",
        "TRUE",
        "'Should' is the standard modal for advice.",
      ),
      fillBlank(
        "4",
        "Complete: You ___ obey the school rules. (obligation)",
        "must",
        "'Must' fits the obligation.",
      ),
    ],
    attempts: [
      {
        student: "student.aungmin",
        status: AttemptStatus.COMPLETED,
        wrong: ["3"],
        startedAt: daysAgo(3, 3),
        completedAt: daysAgo(3, 2),
      },
    ],
  },
  {
    key: "mya-speaking",
    subjectCode: "MYA",
    title: "မြန်မာစာ — အခန်း ၁ စစ်ဆေးမှု",
    difficulty: Difficulty.MEDIUM,
    questions: [
      mcq(
        "1",
        "စကားပြောရာတွင် အသံအနိမ့်အမြင့်သည် အဘယ်ကြောင့် အရေးကြီးသနည်း။",
        [
          "အဓိပ္ပာယ်ကို မှန်ကန်စေရန်",
          "အသံကျယ်ရန်",
          "စာရေးရန်",
          "အချိန်ကုန်သက်သာရန်",
        ],
        "A",
        "အသံအနိမ့်အမြင့် မှန်ကန်မှသာ အဓိပ္ပာယ် မှန်ကန်စွာ ပေါ်ထွက်သည်။",
      ),
      trueFalse(
        "2",
        "အသံအလေးအပေါ့သည် စကားပြောတွင် အရေးပါသည်။",
        "TRUE",
        "အလေးအပေါ့သံက စကား၏ အဓိပ္ပာယ်ကို ပြောင်းလဲစေနိုင်သည်။",
      ),
      mcq(
        "3",
        "ထိထိရောက်ရောက် စကားပြောဆိုရန် အရေးကြီးဆုံးအချက်မှာ မည်သည့်အရာနည်း။",
        ["ရှင်းလင်းပြတ်သားမှု", "အသံကျယ်ခြင်း", "မြန်ခြင်း", "စကားများခြင်း"],
        "A",
        "ရှင်းလင်းပြတ်သားမှုသည် ထိရောက်သော ဆက်သွယ်မှု၏ အခြေခံဖြစ်သည်။",
      ),
    ],
    attempts: [],
  },
  {
    key: "bio-cells",
    subjectCode: "BIO",
    title: "Cell Biology — Starter",
    difficulty: Difficulty.EASY,
    questions: [
      mcq(
        "1",
        "Which organelle is the powerhouse of the cell?",
        ["mitochondrion", "ribosome", "nucleus", "chloroplast"],
        "A",
        "Mitochondria produce ATP.",
      ),
      mcq(
        "2",
        "Which process produces two identical cells?",
        ["mitosis", "meiosis", "osmosis", "diffusion"],
        "A",
        "Mitosis produces two identical daughter cells.",
      ),
      trueFalse(
        "3",
        "DNA is found in the nucleus.",
        "TRUE",
        "Nuclear DNA is packaged in chromosomes.",
      ),
      fillBlank(
        "4",
        "The basic unit of life is the ___.",
        "cell",
        "All living things are made of cells.",
      ),
    ],
    attempts: [
      {
        student: "student.aungmin",
        status: AttemptStatus.COMPLETED,
        wrong: ["1", "2"],
        startedAt: daysAgo(5, 2),
        completedAt: daysAgo(5, 1),
      },
    ],
  },
];

function wrongAnswerFor(question: QuestionSeed): string {
  if (question.options) {
    const option = question.options.find(
      (candidate) => candidate.id !== question.answer,
    );
    return option?.id ?? "WRONG";
  }
  return "incorrect";
}

export async function seedAssessments(
  prisma: SeedPrisma,
  userIds: Map<string, string>,
  targets: TargetMap,
): Promise<void> {
  for (const quiz of QUIZZES) {
    const target = targets.get(quiz.subjectCode);
    if (!target) continue;

    const quizId = sid("quiz", quiz.key);

    await prisma.quiz.upsert({
      where: { id: quizId },
      update: {
        title: quiz.title,
        difficulty: quiz.difficulty,
        subjectId: target.subjectId,
        chapterId: target.chapterId,
        lessonId: target.lessonId,
      },
      create: {
        id: quizId,
        userId: null,
        title: quiz.title,
        difficulty: quiz.difficulty,
        subjectId: target.subjectId,
        chapterId: target.chapterId,
        lessonId: target.lessonId,
      },
    });

    const questionsByKey = new Map<string, QuestionSeed>();

    for (const [index, question] of quiz.questions.entries()) {
      questionsByKey.set(question.key, question);
      const questionId = sid("question", quiz.key, question.key);

      await prisma.question.upsert({
        where: { id: questionId },
        update: {
          type: question.type,
          question: question.question,
          options: question.options ?? undefined,
          answer: question.answer,
          explanation: question.explanation,
          order: index + 1,
          points: 1,
        },
        create: {
          id: questionId,
          quizId,
          type: question.type,
          question: question.question,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          order: index + 1,
          points: 1,
        },
      });
    }

    for (const attempt of quiz.attempts) {
      const userId = userIds.get(attempt.student);
      if (!userId) continue;

      const attemptId = sid("attempt", attempt.student, quiz.key);
      const answeredKeys =
        attempt.answeredKeys ?? quiz.questions.map((question) => question.key);
      const wrong = new Set(attempt.wrong ?? []);

      let correct = 0;
      const answerRows: {
        key: string;
        questionId: string;
        userAnswer: string;
        isCorrect: boolean;
      }[] = [];

      for (const key of answeredKeys) {
        const question = questionsByKey.get(key);
        if (!question) continue;
        const isCorrect = !wrong.has(key);
        if (isCorrect) correct += 1;
        answerRows.push({
          key,
          questionId: sid("question", quiz.key, key),
          userAnswer: isCorrect ? question.answer : wrongAnswerFor(question),
          isCorrect,
        });
      }

      const isCompleted = attempt.status === AttemptStatus.COMPLETED;
      const score = isCompleted ? correct / quiz.questions.length : null;

      await prisma.quizAttempt.upsert({
        where: { id: attemptId },
        update: {
          status: attempt.status,
          score,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt ?? null,
        },
        create: {
          id: attemptId,
          userId,
          quizId,
          status: attempt.status,
          score,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt ?? null,
        },
      });

      for (const row of answerRows) {
        await prisma.answer.upsert({
          where: { id: sid("answer", attempt.student, quiz.key, row.key) },
          update: {
            userAnswer: row.userAnswer,
            isCorrect: row.isCorrect,
          },
          create: {
            id: sid("answer", attempt.student, quiz.key, row.key),
            attemptId,
            questionId: row.questionId,
            userId,
            userAnswer: row.userAnswer,
            isCorrect: row.isCorrect,
            timeSpentSec: 40,
          },
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Mastery
// ---------------------------------------------------------------------------

const SUBJECT_MASTERY: Record<string, Record<string, number>> = {
  "student.aungmin": {
    MATH: 0.78,
    PHY: 0.72,
    CHEM: 0.6,
    ENG: 0.85,
    MYA: 0.9,
    BIO: 0.55,
  },
  "student.sumyat": { MATH: 0.66, CHEM: 0.58, ENG: 0.8 },
  "student.kyaw": { PHY: 0.48, BIO: 0.62 },
};

const CHAPTER_MASTERY: { student: string; code: string; score: number }[] = [
  { student: "student.aungmin", code: "MATH", score: 0.45 },
  { student: "student.aungmin", code: "BIO", score: 0.5 },
  { student: "student.sumyat", code: "CHEM", score: 0.52 },
  { student: "student.kyaw", code: "PHY", score: 0.44 },
];

export async function seedMastery(
  prisma: SeedPrisma,
  userIds: Map<string, string>,
  targets: TargetMap,
): Promise<void> {
  for (const [student, scores] of Object.entries(SUBJECT_MASTERY)) {
    const userId = userIds.get(student);
    if (!userId) continue;

    for (const [code, score] of Object.entries(scores)) {
      const target = targets.get(code);
      if (!target) continue;

      await prisma.masteryScore.upsert({
        where: {
          userId_scopeType_scopeId: {
            userId,
            scopeType: MasteryScope.SUBJECT,
            scopeId: target.subjectId,
          },
        },
        update: { score, attempts: 3, lastSeen: daysAgo(1) },
        create: {
          userId,
          scopeType: MasteryScope.SUBJECT,
          scopeId: target.subjectId,
          score,
          attempts: 3,
          lastSeen: daysAgo(1),
        },
      });
    }
  }

  for (const row of CHAPTER_MASTERY) {
    const userId = userIds.get(row.student);
    const target = targets.get(row.code);
    if (!userId || !target?.chapterId) continue;

    await prisma.masteryScore.upsert({
      where: {
        userId_scopeType_scopeId: {
          userId,
          scopeType: MasteryScope.CHAPTER,
          scopeId: target.chapterId,
        },
      },
      update: { score: row.score, attempts: 2, lastSeen: daysAgo(2) },
      create: {
        userId,
        scopeType: MasteryScope.CHAPTER,
        scopeId: target.chapterId,
        score: row.score,
        attempts: 2,
        lastSeen: daysAgo(2),
      },
    });
  }
}
