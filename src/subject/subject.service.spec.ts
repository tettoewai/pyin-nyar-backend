import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateSubjectDto } from "@/subject/dto/create-subject.dto.js";
import { SubjectService } from "@/subject/subject.service.js";
import type { PrismaService } from "@/prisma/prisma.service.js";

function uniqueViolation() {
  return new PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

function createPrismaMock() {
  return {
    subject: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

type PrismaMock = ReturnType<typeof createPrismaMock>;

describe("SubjectService", () => {
  let prisma: PrismaMock;
  let service: SubjectService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SubjectService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("writes the subject keyed on grade and code", async () => {
      prisma.subject.create.mockResolvedValue({ id: "sub_1" });

      const result = await service.create("Mathematics", "MATH", "GRADE_12");

      expect(prisma.subject.create).toHaveBeenCalledWith({
        data: { name: "Mathematics", code: "MATH", grade: "GRADE_12" },
      });
      expect(result).toMatchObject({ success: true });
    });

    it("trims the code so whitespace cannot fork a subject", async () => {
      prisma.subject.create.mockResolvedValue({ id: "sub_1" });

      await service.create("Mathematics", "  MATH  ", "GRADE_12");

      expect(prisma.subject.create.mock.calls[0][0].data.code).toBe("MATH");
    });

    it("rejects a whitespace-only code before touching the database", async () => {
      await expect(
        service.create("Mathematics", "   ", "GRADE_12"),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.subject.create).not.toHaveBeenCalled();
    });

    // D6: a duplicate used to surface as a 500 because P2002 is not an
    // HttpException and the global filter only catches HttpException.
    it("maps a duplicate to 409 instead of a 500", async () => {
      prisma.subject.create.mockRejectedValue(uniqueViolation());
      prisma.subject.findFirst.mockResolvedValue({
        id: "sub_1",
        deletedAt: null,
      });

      const error = await service
        .create("Mathematics", "MATH", "GRADE_12")
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getStatus()).toBe(409);
      expect(error.message).toContain("MATH");
      expect(error.message).toContain("GRADE_12");
    });

    it("points at restore when the conflicting subject is soft-deleted", async () => {
      prisma.subject.create.mockRejectedValue(uniqueViolation());
      prisma.subject.findFirst.mockResolvedValue({
        id: "sub_old",
        deletedAt: new Date(),
      });

      const error = await service
        .create("Mathematics", "MATH", "GRADE_12")
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toContain("/admin/subject/sub_old/restore");
    });

    it("propagates unexpected database errors untouched", async () => {
      prisma.subject.create.mockRejectedValue(new Error("connection lost"));

      await expect(
        service.create("Mathematics", "MATH", "GRADE_12"),
      ).rejects.toThrow("connection lost");
    });
  });

  describe("update", () => {
    it("throws 404 for an unknown subject", async () => {
      prisma.subject.findUnique.mockResolvedValue(null);

      await expect(
        service.update("nope", undefined, "MATH"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.subject.update).not.toHaveBeenCalled();
    });

    it("leaves omitted fields untouched and trims a supplied code", async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: "sub_1" });
      prisma.subject.update.mockResolvedValue({ id: "sub_1" });

      await service.update("sub_1", undefined, "  MATH  ");

      expect(prisma.subject.update.mock.calls[0][0].data).toEqual({
        code: "MATH",
      });
    });

    it("maps a code collision with another subject to 409", async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: "sub_1" });
      prisma.subject.update.mockRejectedValue(uniqueViolation());

      const error = await service
        .update("sub_1", "Mathematics", "PHY")
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getStatus()).toBe(409);
    });

    it("rejects a blank code", async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: "sub_1" });

      await expect(
        service.update("sub_1", undefined, "  "),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.subject.update).not.toHaveBeenCalled();
    });
  });
});

describe("CreateSubjectDto", () => {
  const base = { name: "Physics", grade: "GRADE_12" };

  it("rejects a missing code", async () => {
    const dto = plainToInstance(CreateSubjectDto, { ...base });
    const errors = await validate(dto);

    expect(errors.map((e) => e.property)).toContain("code");
  });

  it("rejects an empty code", async () => {
    const dto = plainToInstance(CreateSubjectDto, { ...base, code: "" });
    const errors = await validate(dto);

    expect(errors.map((e) => e.property)).toContain("code");
  });

  it("accepts a complete subject", async () => {
    const dto = plainToInstance(CreateSubjectDto, { ...base, code: "PHY" });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
