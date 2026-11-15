import { NotFoundException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ProfileService } from "@/profile/profile.service.js";
import type { PrismaService } from "@/prisma/prisma.service.js";

function uniqueViolation() {
  return new PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn() },
    profile: { upsert: vi.fn(), findUniqueOrThrow: vi.fn() },
  };
}

type PrismaMock = ReturnType<typeof createPrismaMock>;

describe("ProfileService", () => {
  let prisma: PrismaMock;
  let service: ProfileService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ProfileService(prisma as unknown as PrismaService);
  });

  it("returns the existing profile without writing", async () => {
    const profile = { id: "profile_1", userId: "user_1" };
    prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "a@example.com",
      profile,
    });

    const result = await service.getProfile("user_1");

    expect(result.data).toMatchObject({ id: "user_1", profile });
    expect(prisma.profile.upsert).not.toHaveBeenCalled();
  });

  it("never returns passwordHash", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      profile: { id: "profile_1", userId: "user_1" },
    });

    const result = await service.getProfile("user_1");

    expect(result.data).not.toHaveProperty("passwordHash");
    // The projection is enforced at the query level, not after the fact.
    expect(prisma.user.findUnique.mock.calls[0][0]).toMatchObject({
      omit: { passwordHash: true },
    });
  });

  it("lazily creates a missing profile on first read", async () => {
    const created = { id: "profile_new", userId: "user_1" };
    prisma.user.findUnique.mockResolvedValue({ id: "user_1", profile: null });
    prisma.profile.upsert.mockResolvedValue(created);

    const result = await service.getProfile("user_1");

    expect(prisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      create: { userId: "user_1" },
      update: {},
    });
    expect(result.data).toMatchObject({ profile: created });
  });

  it("survives a concurrent first read losing the unique race", async () => {
    const existing = { id: "profile_1", userId: "user_1" };
    prisma.user.findUnique.mockResolvedValue({ id: "user_1", profile: null });
    prisma.profile.upsert.mockRejectedValue(uniqueViolation());
    prisma.profile.findUniqueOrThrow.mockResolvedValue(existing);

    const result = await service.getProfile("user_1");

    expect(prisma.profile.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(result.data).toMatchObject({ profile: existing });
  });

  it("propagates unexpected database errors", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user_1", profile: null });
    prisma.profile.upsert.mockRejectedValue(new Error("connection lost"));

    await expect(service.getProfile("user_1")).rejects.toThrow(
      "connection lost",
    );
  });

  it("throws 404 for a missing user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile("nope")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.profile.upsert).not.toHaveBeenCalled();
  });
});
