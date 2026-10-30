import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SubjectController } from "./subject.controller.js";
import { SubjectService } from "./subject.service.js";
import { SubjectAdminController } from "./subject-admin.controller.js";

@Module({
  controllers: [SubjectController, SubjectAdminController],
  providers: [SubjectService],
  imports: [PrismaModule, AuthModule],
})
export class SubjectModule {}
