import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "@/auth/auth.service.js";
import type { OtpService } from "@/auth/otp.service.js";
import type { TokenService } from "@/auth/token.service.js";
import type { PrismaService } from "@/prisma/prisma.service.js";

const configValues: Record<string, string> = {
  GOOGLE_WEB_CLIENT_ID: "web-client",
  GOOGLE_IOS_CLIENT_ID: "ios-client",
  GOOGLE_ANDROID_CLIENT_ID: "android-client",
  JWT_RESET_SECRET: "reset-secret",
  JWT_RESET_TTL: "600",
};

function createPrismaMock() {
  return { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } };
}

type PrismaMock = ReturnType<typeof createPrismaMock>;

function createService(prisma: PrismaMock) {
  const otpService = { verifyOtp: vi.fn().mockResolvedValue("challenge_1") };
  const tokenService = {
    issue: vi.fn().mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: 900,
    }),
  };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    otpService as unknown as OtpService,
    tokenService as unknown as TokenService,
    { getOrThrow: (key: string) => configValues[key] } as ConfigService,
    { signAsync: vi.fn(), verifyAsync: vi.fn() } as unknown as JwtService,
  );

  return { service, otpService, tokenService };
}

describe("AuthService", () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  describe("signup", () => {
    // D7: signup used to create a User with no Profile row.
    it("creates the Profile row in the same write as the User", async () => {
      const { service, tokenService } = createService(prisma);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "user_1",
        email: "student@example.com",
        role: "STUDENT",
      });

      await service.signup(
        "Student@Example.com",
        "Secret1!",
        "student_1",
        "Secret1!",
        "123456",
        { ip: "127.0.0.1" },
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "student@example.com",
          userName: "student_1",
          role: "STUDENT",
          profile: { create: {} },
        }),
      });
      expect(tokenService.issue).toHaveBeenCalledWith(
        "user_1",
        "student@example.com",
        "STUDENT",
        { ip: "127.0.0.1" },
      );
    });
  });

  describe("googleLogin", () => {
    const payload = {
      sub: "google_1",
      email: "User@Example.com",
      email_verified: true,
      name: "Google User",
      picture: "https://example.com/p.png",
    };

    function withGooglePayload(service: AuthService) {
      (service as any).googleClient = {
        verifyIdToken: vi.fn().mockResolvedValue({
          getPayload: () => payload,
        }),
      };
    }

    it("creates the Profile row for a brand-new Google account", async () => {
      const { service } = createService(prisma);
      withGooglePayload(service);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        role: "STUDENT",
      });

      await service.googleLogin("id-token", {});

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profile: { create: {} } }),
      });
    });

    it("backfills a Profile row for an existing account on login", async () => {
      const { service } = createService(prisma);
      withGooglePayload(service);
      prisma.user.findUnique.mockResolvedValue({
        id: "user_1",
        name: "Existing Name",
        avatarUrl: null,
      });
      prisma.user.update.mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        role: "STUDENT",
      });

      await service.googleLogin("id-token", {});

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_1" },
        data: expect.objectContaining({
          profile: { upsert: { create: {}, update: {} } },
        }),
      });
    });
  });
});
