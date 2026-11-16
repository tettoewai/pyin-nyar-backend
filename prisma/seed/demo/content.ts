/**
 * Curriculum-adjacent demo content: a Biology subject placeholder (the corpus
 * has no Biology, but the mobile UI shows it), learning-target lookup, and the
 * teacher chat threads behind the Chats tab.
 */
import { Grade, Language, MessageRole } from "@/generated/prisma/client.js";
import type { SeedPrisma, TargetMap } from "./shared.js";
import { sid } from "./shared.js";
import { teacherForSubject } from "./users.js";

const BIOLOGY_PLACEHOLDER =
  "> Placeholder lesson. The provided Grade 12 corpus has no Biology textbook; " +
  "replace this content when the Biology source is available.";

/**
 * Ensure a Biology subject exists so the app's six-subject grid (which includes
 * Biology) has a row to render. Idempotent and clearly marked as placeholder.
 */
export async function ensureBiologySubject(prisma: SeedPrisma): Promise<void> {
  const subject = await prisma.subject.upsert({
    where: { grade_code: { grade: Grade.GRADE_12, code: "BIO" } },
    update: { name: "Biology", deletedAt: null },
    create: { name: "Biology", code: "BIO", grade: Grade.GRADE_12 },
    select: { id: true },
  });

  const chapters = [
    {
      name: "Cell Biology",
      lessons: ["Cell Structure", "Cell Division"],
    },
    {
      name: "Genetics",
      lessons: ["Mendelian Inheritance"],
    },
  ];

  for (const [chapterIndex, chapter] of chapters.entries()) {
    const chapterRow = await prisma.chapter.upsert({
      where: { subjectId_name: { subjectId: subject.id, name: chapter.name } },
      update: { order: chapterIndex + 1, deletedAt: null },
      create: {
        subjectId: subject.id,
        name: chapter.name,
        order: chapterIndex + 1,
      },
      select: { id: true },
    });

    for (const [lessonIndex, lessonName] of chapter.lessons.entries()) {
      await prisma.lesson.upsert({
        where: {
          chapterId_name: { chapterId: chapterRow.id, name: lessonName },
        },
        update: { order: lessonIndex + 1, deletedAt: null },
        create: {
          chapterId: chapterRow.id,
          name: lessonName,
          order: lessonIndex + 1,
          content: `# ${lessonName}\n\n${BIOLOGY_PLACEHOLDER}`,
        },
      });
    }
  }
}

/** First chapter + lesson for each Grade 12 subject, keyed by `Subject.code`. */
export async function loadTargets(prisma: SeedPrisma): Promise<TargetMap> {
  const subjects = await prisma.subject.findMany({
    where: { grade: Grade.GRADE_12, deletedAt: null },
    select: {
      id: true,
      code: true,
      chapters: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        take: 1,
        select: {
          id: true,
          name: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            take: 1,
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const targets: TargetMap = new Map();
  for (const subject of subjects) {
    const chapter = subject.chapters[0];
    const lesson = chapter?.lessons[0];
    targets.set(subject.code, {
      subjectId: subject.id,
      subjectCode: subject.code,
      chapterId: chapter?.id ?? null,
      chapterTitle: chapter?.name ?? null,
      lessonId: lesson?.id ?? null,
      lessonTitle: lesson?.name ?? null,
    });
  }
  return targets;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

interface ThreadSeed {
  title: string;
  language: Language;
  messages: { role: MessageRole; content: string }[];
}

function threadFor(code: string): ThreadSeed | undefined {
  switch (code) {
    case "MATH":
      return {
        title: "Saya Maung",
        language: Language.BILINGUAL,
        messages: [
          {
            role: MessageRole.USER,
            content: "ဆရာ၊ x^2 = -4 ကို ဘာလို့ real number နဲ့ မ​ဖြေနိုင်တာလဲ?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Because every real number squared is non-negative. With i where i^2 = -1, the solutions are 2i and -2i.",
          },
          {
            role: MessageRole.USER,
            content: "Got it! Let's solve x^2 + 2x + 5 = 0 together.",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Complete the square: (x + 1)^2 = -4, so x = -1 ± 2i. Try the next one yourself.",
          },
        ],
      };
    case "PHY":
      return {
        title: "Sayar Aung",
        language: Language.BILINGUAL,
        messages: [
          {
            role: MessageRole.USER,
            content: "What is centripetal acceleration?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "It is the acceleration that points toward the centre of the circular path: a = v^2 / r. I sent the diagram — ပုံကြည့်ပြီး ပြောပြမယ်.",
          },
          {
            role: MessageRole.USER,
            content: "Does speed change in uniform circular motion?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "No. Speed stays constant; only the direction changes, which is why there is still acceleration.",
          },
        ],
      };
    case "CHEM":
      return {
        title: "Sayarma Nilar",
        language: Language.BILINGUAL,
        messages: [
          {
            role: MessageRole.USER,
            content: "ဓာတုဓာတ်ပြုမှုမှာ စွမ်းအင်ပြောင်းလဲမှုကို ဘယ်လိုတွက်မလဲ?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Use the enthalpy change: ΔH = H(products) − H(reactants). Negative ΔH means heat is released (exothermic).",
          },
          {
            role: MessageRole.USER,
            content: "Acid–base quiz ready?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Yes — 10 questions, 15 min. Start with the pressure one 🧪",
          },
        ],
      };
    case "ENG":
      return {
        title: "Sayarma Thida",
        language: Language.BILINGUAL,
        messages: [
          {
            role: MessageRole.USER,
            content: "Can you check my opinion essay introduction?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Great start. Tighten paragraph 2 and add one concrete example — စာပိုဒ် ၂ ပြင်ကြည့် ✍️",
          },
          {
            role: MessageRole.USER,
            content: "Which modal should I use for advice?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Use 'should' for advice and 'must' for strong obligation. They are both modal auxiliaries.",
          },
        ],
      };
    case "MYA":
      return {
        title: "Sayarma Hla",
        language: Language.MY,
        messages: [
          {
            role: MessageRole.USER,
            content: "ဆရာမ၊ ကဗျာရဲ့ အဓိပ္ပာယ်ကို ရှင်းပြပါ။",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "ကဗျာသည် မိမိသားသမီးအပေါ် ထားရှိသော မေတ္တာကို ဖော်ပြထားသည်။ ကဗျာအဓိပ္ပာယ် ရှင်းပြထားတယ် — သိမ်းထားပါ 📖",
          },
          {
            role: MessageRole.USER,
            content: "အသံအနိမ့်အမြင့်က ဘာကြောင့် အရေးကြီးတာလဲ?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "အသံအနိမ့်အမြင့် မှန်ကန်မှသာ စကား၏ အဓိပ္ပာယ်ကို နားထောင်သူ မှန်ကန်စွာ နားလည်နိုင်သည်။",
          },
        ],
      };
    case "BIO":
      return {
        title: "Sayar Ko",
        language: Language.BILINGUAL,
        messages: [
          {
            role: MessageRole.USER,
            content: "Which organelle is the powerhouse of the cell?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "The mitochondrion — it produces ATP through cellular respiration. 🌱 Photosynthesis notes are on the way.",
          },
          {
            role: MessageRole.USER,
            content: "What is the difference between mitosis and meiosis?",
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              "Mitosis makes two identical cells; meiosis makes four genetically different gametes.",
          },
        ],
      };
    default:
      return undefined;
  }
}

const CONVERSATION_SEEDS: { student: string; code: string }[] = [
  { student: "student.aungmin", code: "MATH" },
  { student: "student.aungmin", code: "PHY" },
  { student: "student.aungmin", code: "CHEM" },
  { student: "student.aungmin", code: "ENG" },
  { student: "student.aungmin", code: "MYA" },
  { student: "student.aungmin", code: "BIO" },
  { student: "student.sumyat", code: "MATH" },
  { student: "student.sumyat", code: "CHEM" },
  { student: "student.kyaw", code: "PHY" },
];

export async function seedConversations(
  prisma: SeedPrisma,
  userIds: Map<string, string>,
  targets: TargetMap,
): Promise<void> {
  for (const seed of CONVERSATION_SEEDS) {
    const userId = userIds.get(seed.student);
    const target = targets.get(seed.code);
    const thread = threadFor(seed.code);
    if (!userId || !target || !thread) continue;

    const conversationId = sid("conversation", seed.student, seed.code);

    await prisma.conversation.upsert({
      where: { id: conversationId },
      update: {
        title: thread.title,
        language: thread.language,
        subjectId: target.subjectId,
        chapterId: target.chapterId,
        lessonId: target.lessonId,
      },
      create: {
        id: conversationId,
        userId,
        title: thread.title,
        language: thread.language,
        subjectId: target.subjectId,
        chapterId: target.chapterId,
        lessonId: target.lessonId,
      },
    });

    for (const [index, message] of thread.messages.entries()) {
      const messageId = sid("message", seed.student, seed.code, index + 1);
      // Spread messages a few minutes apart so lists order naturally.
      const createdAt = new Date(
        Date.now() - (thread.messages.length - index) * 7 * 60 * 1000,
      );

      await prisma.message.upsert({
        where: { id: messageId },
        update: { role: message.role, content: message.content },
        create: {
          id: messageId,
          conversationId,
          role: message.role,
          content: message.content,
          model: message.role === MessageRole.ASSISTANT ? "demo-model" : null,
          createdAt,
        },
      });
    }
  }
}
