import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module.js";
import { PrismaModule } from "@/prisma/prisma.module.js";
import { ChapterAdminController } from "@/subject/chapter-admin.controller.js";
import { ChapterController } from "@/subject/chapter.controller.js";
import { ChapterService } from "@/subject/chapter.service.js";
import { CurriculumController } from "@/subject/curriculum.controller.js";
import { LessonAdminController } from "@/subject/lesson-admin.controller.js";
import { LessonController } from "@/subject/lesson.controller.js";
import { LessonService } from "@/subject/lesson.service.js";
import { SubjectAdminController } from "@/subject/subject-admin.controller.js";
import { SubjectController } from "@/subject/subject.controller.js";
import { SubjectService } from "@/subject/subject.service.js";

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
