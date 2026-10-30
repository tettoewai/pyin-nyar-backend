import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator.js";
import { PrismaService } from "./prisma/prisma.service.js";

@Public()
@Controller()
export class AppController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Get("health")
  async health() {
    let dbStatus = "unreachable";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "healthy";
    } catch {
      // DB is down — report it but don't crash
    }

    return {
      status: "ok",
      service: "pyin-nyar-api",
      version: "1.0.0",
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}