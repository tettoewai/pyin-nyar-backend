/** Demo study plans, uploads and usage logs. */
import { StudyPlanStatus, UploadType } from "@/generated/prisma/client.js";
import type { SeedPrisma, TargetMap } from "./shared.js";
import { daysAgo, sid } from "./shared.js";

interface PlanItemSeed {
  key: string;
  order: number;
  completed: boolean;
  dueInDays: number;
  notes: string;
  subjectCode?: string;
}

interface PlanSeed {
  key: string;
  student: string;
  title: string;
  status: StudyPlanStatus;
  startsDaysAgo: number;
  endsInDays: number;
  items: PlanItemSeed[];
}

const PLANS: PlanSeed[] = [
  {
    key: "aungmin-matric",
    student: "student.aungmin",
    title: "Grade 12 Maths — 2 week boost",
    status: StudyPlanStatus.ACTIVE,
    startsDaysAgo: 4,
    endsInDays: 10,
    items: [
      {
        key: "review",
        order: 1,
        completed: true,
        dueInDays: -2,
        notes: "Re-read the worked examples in chapter 1.",
        subjectCode: "MATH",
      },
      {
        key: "quiz",
        order: 2,
        completed: false,
        dueInDays: 0,
        notes: "Retake the complex numbers quiz.",
        subjectCode: "MATH",
      },
      {
        key: "practice",
        order: 3,
        completed: false,
        dueInDays: 2,
        notes: "Do 10 mixed practice questions.",
        subjectCode: "MATH",
      },
      {
        key: "physics",
        order: 4,
        completed: false,
        dueInDays: 4,
        notes: "Skim rotational motion summary.",
        subjectCode: "PHY",
      },
    ],
  },
  {
    key: "sumyat-chemistry",
    student: "student.sumyat",
    title: "Chemistry catch-up",
    status: StudyPlanStatus.ACTIVE,
    startsDaysAgo: 1,
    endsInDays: 6,
    items: [
      {
        key: "energy",
        order: 1,
        completed: false,
        dueInDays: 1,
        notes: "Finish the energy changes exercises.",
        subjectCode: "CHEM",
      },
      {
        key: "enthalpy",
        order: 2,
        completed: false,
        dueInDays: 3,
        notes: "Practise Hess's law calculations.",
        subjectCode: "CHEM",
      },
    ],
  },
];

const UPLOADS = [
  {
    student: "student.aungmin",
    key: "homework-page-1",
    type: UploadType.IMAGE,
    url: "https://example.com/demo/homework-page-1.jpg",
    filename: "homework-page-1.jpg",
    mimeType: "image/jpeg",
    size: 248_000,
    extractedText: "Solve x^2 + 2x + 5 = 0.",
  },
  {
    student: "student.aungmin",
    key: "worksheet-pdf",
    type: UploadType.PDF,
    url: "https://example.com/demo/maths-worksheet.pdf",
    filename: "maths-worksheet.pdf",
    mimeType: "application/pdf",
    size: 1_120_000,
    extractedText: "Chapter 1 exercises: complex numbers, question 1 to 12.",
  },
  {
    student: "student.sumyat",
    key: "chem-notes",
    type: UploadType.IMAGE,
    url: "https://example.com/demo/chem-notes.jpg",
    filename: "chem-notes.jpg",
    mimeType: "image/jpeg",
    size: 302_000,
    extractedText: "Enthalpy change diagram with reactants and products.",
  },
];

const USAGE_LOGS = [
  {
    student: "student.aungmin",
    key: "1",
    action: "chat",
    model: "demo-model",
    promptTokens: 120,
    completionTokens: 240,
    daysAgo: 0,
  },
  {
    student: "student.aungmin",
    key: "2",
    action: "quiz",
    model: null,
    promptTokens: 0,
    completionTokens: 0,
    daysAgo: 0,
  },
  {
    student: "student.aungmin",
    key: "3",
    action: "ocr",
    model: "demo-vision",
    promptTokens: 340,
    completionTokens: 120,
    daysAgo: 1,
  },
  {
    student: "student.aungmin",
    key: "4",
    action: "chat",
    model: "demo-model",
    promptTokens: 90,
    completionTokens: 180,
    daysAgo: 3,
  },
  {
    student: "student.sumyat",
    key: "1",
    action: "chat",
    model: "demo-model",
    promptTokens: 70,
    completionTokens: 150,
    daysAgo: 1,
  },
  {
    student: "student.sumyat",
    key: "2",
    action: "quiz",
    model: null,
    promptTokens: 0,
    completionTokens: 0,
    daysAgo: 2,
  },
];

export async function seedActivity(
  prisma: SeedPrisma,
  userIds: Map<string, string>,
  targets: TargetMap,
): Promise<void> {
  for (const plan of PLANS) {
    const userId = userIds.get(plan.student);
    if (!userId) continue;

    const planId = sid("study-plan", plan.key);
    const startDate = daysAgo(plan.startsDaysAgo);
    const endDate = new Date(
      Date.now() + plan.endsInDays * 24 * 60 * 60 * 1000,
    );

    await prisma.studyPlan.upsert({
      where: { id: planId },
      update: { title: plan.title, status: plan.status, startDate, endDate },
      create: {
        id: planId,
        userId,
        title: plan.title,
        status: plan.status,
        startDate,
        endDate,
      },
    });

    for (const item of plan.items) {
      const target = item.subjectCode
        ? targets.get(item.subjectCode)
        : undefined;
      const dueDate = new Date(
        Date.now() + item.dueInDays * 24 * 60 * 60 * 1000,
      );

      await prisma.studyPlanItem.upsert({
        where: { id: sid("study-plan-item", plan.key, item.key) },
        update: {
          order: item.order,
          completed: item.completed,
          dueDate,
          notes: item.notes,
          subjectId: target?.subjectId ?? null,
          chapterId: target?.chapterId ?? null,
          lessonId: target?.lessonId ?? null,
        },
        create: {
          id: sid("study-plan-item", plan.key, item.key),
          studyPlanId: planId,
          subjectId: target?.subjectId ?? null,
          chapterId: target?.chapterId ?? null,
          lessonId: target?.lessonId ?? null,
          order: item.order,
          completed: item.completed,
          dueDate,
          notes: item.notes,
        },
      });
    }
  }

  for (const upload of UPLOADS) {
    const userId = userIds.get(upload.student);
    if (!userId) continue;

    await prisma.upload.upsert({
      where: { id: sid("upload", upload.key) },
      update: { extractedText: upload.extractedText },
      create: {
        id: sid("upload", upload.key),
        userId,
        type: upload.type,
        url: upload.url,
        filename: upload.filename,
        mimeType: upload.mimeType,
        size: upload.size,
        extractedText: upload.extractedText,
      },
    });
  }

  for (const log of USAGE_LOGS) {
    const userId = userIds.get(log.student);
    if (!userId) continue;

    const totalTokens = log.promptTokens + log.completionTokens;

    await prisma.usageLog.upsert({
      where: { id: sid("usage", log.student, log.key) },
      update: {
        action: log.action,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens,
        createdAt: daysAgo(log.daysAgo),
      },
      create: {
        id: sid("usage", log.student, log.key),
        userId,
        action: log.action,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens,
        createdAt: daysAgo(log.daysAgo),
      },
    });
  }
}
