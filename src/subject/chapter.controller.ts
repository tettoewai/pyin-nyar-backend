import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator.js";
import { ChapterService } from "./chapter.service.js";

@Public()
@Controller()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get("subject/:subjectId/chapter")
  findBySubject(@Param("subjectId") subjectId: string) {
    return this.chapterService.findBySubject(subjectId);
  }

  @Get("chapter/:id")
  findOne(@Param("id") id: string) {
    return this.chapterService.findOne(id);
  }
}
