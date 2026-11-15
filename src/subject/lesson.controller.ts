import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "@/auth/decorators/public.decorator.js";
import { LessonService } from "@/subject/lesson.service.js";

@Public()
@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get("chapter/:chapterId/lesson")
  findByChapter(@Param("chapterId") chapterId: string) {
    return this.lessonService.findByChapter(chapterId);
  }

  @Get("lesson/:id")
  findOne(@Param("id") id: string) {
    return this.lessonService.findOne(id);
  }
}
