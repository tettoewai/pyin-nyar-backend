import { Logger, NotFoundException } from "@nestjs/common";
import { StudentKycService } from "@/student-kyc/student-kyc.service.js";
import type { CryptoService } from "@/common/crypto.service.js";
import type { PrismaService } from "@/prisma/prisma.service.js";

const baseDto = {
  grade: "GRADE_12",
  name: "Aung Aung",
  dateOfBirth: "2010-05-20",
  gender: "MALE",
  docType: "STUDENT_CARD",
  docNumber: "12/AhGaNa(N)123456",
  school: "BEHS 1",
  region: "Yangon",
  guardianPhone: "09987654321",
  preferredSubjectIds: ["sub_1", "sub_2"],
};

function createPrismaMock() {
  const prisma = {
    studentKyc: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { update: vi.fn() },
    subject: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
  return prisma;
}

function createCryptoMock() {
  return {
    encrypt: vi.fn((v: string) => `enc(${v})`),
    blindIndex: vi.fn((v: string) => `idx(${v})`),
  };
}

type PrismaMock = ReturnType<typeof createPrismaMock>;
type CryptoMock = ReturnType<typeof createCryptoMock>;

describe("StudentKycService", () => {
  let prisma: PrismaMock;
  let crypto: CryptoMock;
  let service: StudentKycService;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    prisma = createPrismaMock();
    crypto = createCryptoMock();
    service = new StudentKycService(
      prisma as unknown as PrismaService,
      crypto as unknown as CryptoService,
    );
    warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe("create", () => {
    beforeEach(() => {
      prisma.studentKyc.findFirst.mockResolvedValue(null);
      prisma.studentKyc.create.mockResolvedValue({ id: "kyc_1" });
      prisma.user.update.mockResolvedValue({ id: "user_1" });
    });

    // D4: create used to match on Subject.code while update matched on
    // Subject.id, so the same payload could not do both.
    it("resolves preferred subjects by id, not code", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
        { id: "sub_2", name: "Physics", grade: "GRADE_12" },
      ]);

      await service.create("user_1", baseDto as any);

      const where = prisma.subject.findMany.mock.calls[0][0].where;
      expect(where.id).toEqual({ in: ["sub_1", "sub_2"] });
      expect(where.code).toBeUndefined();
      expect(
        prisma.studentKyc.create.mock.calls[0][0].data.preferredSubjects,
      ).toEqual({ connect: [{ id: "sub_1" }, { id: "sub_2" }] });
    });

    it("throws 404 when a subject id does not exist", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
      ]);

      await expect(
        service.create("user_1", baseDto as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("deduplicates repeated ids rather than treating them as missing", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
      ]);

      await service.create("user_1", {
        ...baseDto,
        preferredSubjectIds: ["sub_1", "sub_1"],
      } as any);

      expect(prisma.subject.findMany.mock.calls[0][0].where.id).toEqual({
        in: ["sub_1"],
      });
      expect(
        prisma.studentKyc.create.mock.calls[0][0].data.preferredSubjects,
      ).toEqual({ connect: [{ id: "sub_1" }] });
    });

    it("warns but does not block when a subject is outside the grade", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_11" },
      ]);

      await service.create("user_1", {
        ...baseDto,
        preferredSubjectIds: ["sub_1"],
      } as any);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(prisma.studentKyc.create).toHaveBeenCalled();
    });

    it("does not warn when the subject grade matches", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
        { id: "sub_2", name: "Physics", grade: "GRADE_12" },
      ]);

      await service.create("user_1", baseDto as any);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    beforeEach(() => {
      prisma.studentKyc.findUnique.mockResolvedValue({
        id: "kyc_1",
        status: "PENDING",
        user: { grade: "GRADE_12" },
      });
      prisma.studentKyc.update.mockResolvedValue({ id: "kyc_1" });
      prisma.user.update.mockResolvedValue({ id: "user_1" });
    });

    it("resolves preferred subjects by id and sets the relation", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
      ]);

      await service.update("user_1", {
        preferredSubjectIds: ["sub_1"],
      } as any);

      expect(prisma.subject.findMany.mock.calls[0][0].where.id).toEqual({
        in: ["sub_1"],
      });
      expect(
        prisma.studentKyc.update.mock.calls[0][0].data.preferredSubjects,
      ).toEqual({ set: [{ id: "sub_1" }] });
    });

    it("falls back to the stored user grade when updating subjects only", async () => {
      prisma.studentKyc.findUnique.mockResolvedValue({
        id: "kyc_1",
        status: "PENDING",
        user: { grade: "GRADE_12" },
      });
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_10" },
      ]);

      await service.update("user_1", {
        preferredSubjectIds: ["sub_1"],
      } as any);

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("accepts the same payload shape as create", async () => {
      prisma.subject.findMany.mockResolvedValue([
        { id: "sub_1", name: "Mathematics", grade: "GRADE_12" },
        { id: "sub_2", name: "Physics", grade: "GRADE_12" },
      ]);

      await service.update("user_1", {
        preferredSubjectIds: baseDto.preferredSubjectIds,
      } as any);

      expect(
        prisma.studentKyc.update.mock.calls[0][0].data.preferredSubjects,
      ).toEqual({ set: [{ id: "sub_1" }, { id: "sub_2" }] });
    });

    it("throws 404 when a subject id does not exist", async () => {
      prisma.subject.findMany.mockResolvedValue([]);

      await expect(
        service.update("user_1", { preferredSubjectIds: ["nope"] } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.studentKyc.update).not.toHaveBeenCalled();
    });

    it("leaves subjects untouched when the field is omitted", async () => {
      await service.update("user_1", { school: "BEHS 2" } as any);

      expect(prisma.subject.findMany).not.toHaveBeenCalled();
      expect(prisma.studentKyc.update.mock.calls[0][0].data).not.toHaveProperty(
        "preferredSubjects",
      );
    });

    it("throws 404 when the caller has no KYC", async () => {
      prisma.studentKyc.findUnique.mockResolvedValue(null);

      await expect(
        service.update("user_1", { school: "BEHS 2" } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
