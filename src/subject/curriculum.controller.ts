import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "@/auth/decorators/public.decorator.js";
import { CurriculumQueryDto } from "@/subject/dto/curriculum-query.dto.js";
import { SubjectService } from "@/subject/subject.service.js";

@Public()
@Controller("curriculum")
export class CurriculumController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  get(@Query() query: CurriculumQueryDto) {
    return this.subjectService.findCurriculum(query.grade);
  }
}
