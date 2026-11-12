import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ChapterAdminController } from "./chapter-admin.controller.js";
import { ChapterController } from "./chapter.controller.js";
import { ChapterService } from "./chapter.service.js";
import { CurriculumController } from "./curriculum.controller.js";
import { LessonAdminController } from "./lesson-admin.controller.js";
import { LessonController } from "./lesson.controller.js";
import { LessonService } from "./lesson.service.js";
import { SubjectAdminController } from "./subject-admin.controller.js";
import { SubjectController } from "./subject.controller.js";
import { SubjectService } from "./subject.service.js";

@Module({
  controllers: [
    SubjectController,
    SubjectAdminController,
    ChapterController,
    ChapterAdminController,
    LessonController,
    LessonAdminController,
    CurriculumController,
  ],
  providers: [SubjectService, ChapterService, LessonService],
  imports: [PrismaModule, AuthModule],
})
export class SubjectModule {}
