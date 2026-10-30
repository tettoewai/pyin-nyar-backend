import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller.js";
import { PrismaService } from "./prisma/prisma.service.js";

describe("AppController", () => {
  let appController: AppController;

  const mockPrisma = {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("health", () => {
    it('should return "ok" status with healthy database', async () => {
      const result = await appController.health();
      expect(result.status).toBe("ok");
      expect(result.service).toBe("pyin-nyar-api");
      expect(result.database).toBe("healthy");
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should report database as unreachable on failure", async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("connection lost"));
      const result = await appController.health();
      expect(result.status).toBe("ok");
      expect(result.database).toBe("unreachable");
    });
  });
});