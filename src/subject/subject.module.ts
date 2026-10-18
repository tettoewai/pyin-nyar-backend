import { Module } from "@nestjs/common";
import { SubjectController } from "./subject.controller.js";
import { SubjectService } from "./subject.service.js";
import { SubjectAdminController } from "./subject-admin.controller.js";
import { TokenService } from "../auth/token.service.js";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service.js";

@Module({
  controllers: [SubjectController, SubjectAdminController],
  providers: [SubjectService, TokenService, JwtService, PrismaService],
})
export class SubjectModule {}
