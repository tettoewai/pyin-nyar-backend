/**
 * Demo users, profiles and KYC records.
 *
 * The teacher names/subjects mirror the mobile app's mock teacher list so the
 * Chats and teacher-profile screens can be wired without remapping identities.
 */
import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import {
  Gender,
  Grade,
  KycDocType,
  KycStatus,
  Language,
  Role,
} from "@/generated/prisma/client.js";
import type { SeedPrisma } from "./shared.js";
import type { DemoSeedLogger } from "./shared.js";

const AVATAR_A =
  "https://storage.googleapis.com/banani-generated-images/generated-images/25d56666-863f-48f1-8118-82fb9938006f.jpg";
const AVATAR_B =
  "https://storage.googleapis.com/banani-generated-images/generated-images/006dcd7c-e8b9-4c7c-b927-e97c06a5ac83.jpg";
const AVATAR_C =
  "https://storage.googleapis.com/banani-generated-images/generated-images/2f2dac33-071d-4563-bb20-6934f8acad46.jpg";
const AVATAR_D =
  "https://storage.googleapis.com/banani-generated-images/generated-images/186d9dc8-dd33-4a6c-88e9-14a114ce4a38.jpg";

export interface DemoUserDefinition {
  userName: string;
  email: string;
  name: string;
  role: Role;
  grade: Grade | null;
  language: Language;
  avatarUrl?: string;
  /** For teachers: the subject they own, keyed by `Subject.code`. */
  subjectCode?: string;
  profile: {
    targetExam?: string;
    studyGoal?: string;
    dailyGoalXp?: number;
    streakDays?: number;
  };
}

export const DEMO_USERS: DemoUserDefinition[] = [
  {
    userName: "saya_maung",
    email: "saya_maung@pyinnyar.com",
    name: "Saya Maung",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_A,
    subjectCode: "MATH",
    profile: { studyGoal: "Teaches Mathematics" },
  },
  {
    userName: "sayarma_thida",
    email: "sayarma_thida@pyinnyar.com",
    name: "Sayarma Thida",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_B,
    subjectCode: "ENG",
    profile: { studyGoal: "Teaches English" },
  },
  {
    userName: "sayar_aung",
    email: "sayar_aung@pyinnyar.com",
    name: "Sayar Aung",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_C,
    subjectCode: "PHY",
    profile: { studyGoal: "Teaches Physics" },
  },
  {
    userName: "sayarma_nilar",
    email: "sayarma_nilar@pyinnyar.com",
    name: "Sayarma Nilar",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_A,
    subjectCode: "CHEM",
    profile: { studyGoal: "Teaches Chemistry" },
  },
  {
    userName: "sayar_ko",
    email: "sayar_ko@pyinnyar.com",
    name: "Sayar Ko",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_D,
    subjectCode: "BIO",
    profile: { studyGoal: "Teaches Biology" },
  },
  {
    userName: "sayarma_hla",
    email: "sayarma_hla@pyinnyar.com",
    name: "Sayarma Hla",
    role: Role.TEACHER,
    grade: Grade.GRADE_12,
    language: Language.MY,
    avatarUrl: AVATAR_A,
    subjectCode: "MYA",
    profile: { studyGoal: "Teaches Myanmar" },
  },
  {
    userName: "parent.uaye",
    email: "parent.uaye@pyinnyar.com",
    name: "U Aye",
    role: Role.PARENT,
    grade: null,
    language: Language.MY,
    profile: { studyGoal: "Keep an eye on weekly progress" },
  },
  {
    userName: "parent.dawmya",
    email: "parent.dawmya@pyinnyar.com",
    name: "Daw Mya",
    role: Role.PARENT,
    grade: null,
    language: Language.MY,
    profile: { studyGoal: "Support exam preparation" },
  },
  {
    userName: "student.aungmin",
    email: "student.aungmin@pyinnyar.com",
    name: "Aung Min",
    role: Role.STUDENT,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_B,
    profile: {
      targetExam: "Matriculation 2026",
      studyGoal: "Raise Maths from 60% to 80%",
      dailyGoalXp: 50,
      streakDays: 6,
    },
  },
  {
    userName: "student.sumyat",
    email: "student.sumyat@pyinnyar.com",
    name: "Su Myat",
    role: Role.STUDENT,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_A,
    profile: {
      targetExam: "Matriculation 2026",
      studyGoal: "Finish the Chemistry chapters",
      dailyGoalXp: 30,
      streakDays: 2,
    },
  },
  {
    userName: "student.kyaw",
    email: "student.kyaw@pyinnyar.com",
    name: "Kyaw Zin",
    role: Role.STUDENT,
    grade: Grade.GRADE_12,
    language: Language.BILINGUAL,
    avatarUrl: AVATAR_D,
    profile: {
      targetExam: "Matriculation 2026",
      studyGoal: "Build a steady physics habit",
      dailyGoalXp: 20,
      streakDays: 0,
    },
  },
];

export function teacherForSubject(
  code: string,
): DemoUserDefinition | undefined {
  return DEMO_USERS.find(
    (user) => user.role === Role.TEACHER && user.subjectCode === code,
  );
}

export async function seedUsers(
  prisma: SeedPrisma,
  passwordHash: string,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const user of DEMO_USERS) {
    const row = await prisma.user.upsert({
      where: { userName: user.userName },
      update: {
        name: user.name,
        role: user.role,
        language: user.language,
        passwordHash,
        avatarUrl: user.avatarUrl ?? null,
        ...(user.grade ? { grade: user.grade } : {}),
      },
      create: {
        userName: user.userName,
        email: user.email,
        name: user.name,
        role: user.role,
        grade: user.grade ?? undefined,
        language: user.language,
        passwordHash,
        avatarUrl: user.avatarUrl,
      },
      select: { id: true },
    });

    ids.set(user.userName, row.id);

    await prisma.profile.upsert({
      where: { userId: row.id },
      update: {
        targetExam: user.profile.targetExam ?? null,
        studyGoal: user.profile.studyGoal ?? null,
        dailyGoalXp: user.profile.dailyGoalXp ?? 0,
        streakDays: user.profile.streakDays ?? 0,
        lastActiveAt: new Date(),
      },
      create: {
        userId: row.id,
        targetExam: user.profile.targetExam,
        studyGoal: user.profile.studyGoal,
        dailyGoalXp: user.profile.dailyGoalXp ?? 0,
        streakDays: user.profile.streakDays ?? 0,
        lastActiveAt: new Date(),
      },
    });
  }

  return ids;
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

function encrypt(plain: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

function blindIndex(value: string, indexKeyHex: string): string {
  return createHmac("sha256", Buffer.from(indexKeyHex, "hex"))
    .update(value)
    .digest("hex");
}

interface KycSeed {
  student: string;
  status: KycStatus;
  docNumber: string;
  dateOfBirth: string;
  gender: string;
  school: string;
  region: string;
  guardianPhone: string;
  rejectionNote?: string;
}

const KYC_SEEDS: KycSeed[] = [
  {
    student: "student.aungmin",
    status: KycStatus.PENDING,
    docNumber: "12/ABC(N)123456",
    dateOfBirth: "2008-05-14",
    gender: Gender.MALE,
    school: "No. 1 Basic Education High School",
    region: "Yangon",
    guardianPhone: "+959123456789",
  },
  {
    student: "student.sumyat",
    status: KycStatus.APPROVED,
    docNumber: "12/DEF(N)654321",
    dateOfBirth: "2008-11-02",
    gender: Gender.FEMALE,
    school: "No. 2 Basic Education High School",
    region: "Mandalay",
    guardianPhone: "+959987654321",
  },
  {
    student: "student.kyaw",
    status: KycStatus.REJECTED,
    docNumber: "12/GHI(N)112233",
    dateOfBirth: "2008-02-20",
    gender: Gender.MALE,
    school: "Basic Education High School, Hlaing",
    region: "Yangon",
    guardianPhone: "+959555112233",
    rejectionNote: "Document photo is unreadable. Please re-upload.",
  },
];

export async function seedKyc(
  prisma: SeedPrisma,
  userIds: Map<string, string>,
  preferredSubjectIds: string[],
  logger: DemoSeedLogger,
): Promise<void> {
  const encryptionKey = process.env.KYC_ENCRYPTION_KEY;
  const indexKey = process.env.KYC_INDEX_KEY;

  if (!encryptionKey || !indexKey) {
    logger.warn(
      "[demo] skipping KYC seed: KYC_ENCRYPTION_KEY / KYC_INDEX_KEY are not set",
    );
    return;
  }

  const admin = await prisma.user.findUnique({
    where: { email: "admin@pyinnyar.com" },
    select: { id: true },
  });

  for (const kyc of KYC_SEEDS) {
    const userId = userIds.get(kyc.student);
    if (!userId) continue;

    const reviewed = kyc.status !== KycStatus.PENDING && admin;

    try {
      await prisma.studentKyc.upsert({
        where: { userId },
        update: {
          docType: KycDocType.STUDENT_CARD,
          school: encrypt(kyc.school, encryptionKey),
          region: encrypt(kyc.region, encryptionKey),
          guardianPhone: encrypt(kyc.guardianPhone, encryptionKey),
          status: kyc.status,
          rejectionNote: kyc.rejectionNote ?? null,
          reviewedById: reviewed ? admin.id : null,
          reviewedAt: reviewed ? new Date() : null,
          preferredSubjects: {
            set: preferredSubjectIds.map((id) => ({ id })),
          },
        },
        create: {
          userId,
          dateOfBirth: encrypt(kyc.dateOfBirth, encryptionKey),
          gender: encrypt(kyc.gender, encryptionKey),
          docType: KycDocType.STUDENT_CARD,
          docNumber: encrypt(kyc.docNumber, encryptionKey),
          docNumberIndex: blindIndex(kyc.docNumber, indexKey),
          school: encrypt(kyc.school, encryptionKey),
          region: encrypt(kyc.region, encryptionKey),
          guardianPhone: encrypt(kyc.guardianPhone, encryptionKey),
          status: kyc.status,
          rejectionNote: kyc.rejectionNote,
          reviewedById: reviewed ? admin.id : null,
          reviewedAt: reviewed ? new Date() : null,
          preferredSubjects: {
            connect: preferredSubjectIds.map((id) => ({ id })),
          },
        },
      });
    } catch (error) {
      logger.warn(
        `[demo] skipped KYC for ${kyc.student}: ${(error as Error).message}`,
      );
    }
  }
}
