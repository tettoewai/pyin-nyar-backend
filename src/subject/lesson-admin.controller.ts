import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/decorators/auth.guard.js";
import { RolesGuard } from "@/auth/decorators/role.guard.js";
import { Roles } from "@/auth/decorators/roles.decorator.js";
import { CreateLessonDto } from "@/subject/dto/lesson/create-lesson.dto.js";
import { LessonQueryDto } from "@/subject/dto/lesson/lesson-query.dto.js";
import { ReorderLessonsDto } from "@/subject/dto/lesson/reorder-lessons.dto.js";
import { UpdateLessonDto } from "@/subject/dto/lesson/update-lesson.dto.js";
import { LessonService } from "@/subject/lesson.service.js";

@Controller("admin/lesson")
@UseGuards(AuthGuard, RolesGuard)
export class LessonAdminController {
  constructor(private readonly lessonService: LessonService) {}

  @Get("/")
  @Roles("ADMIN")
  getAll(@Query() query: LessonQueryDto) {
    return this.lessonService.adminFindAll(query.chapterId);
  }

  @Get(":id")
  @Roles("ADMIN")
  getOne(@Param("id") id: string) {
    return this.lessonService.adminFindOne(id);
  }

  @Post("/")
  @Roles("ADMIN")
  create(@Body() body: CreateLessonDto) {
    return this.lessonService.create(body);
  }

  @Patch("reorder")
  @Roles("ADMIN")
  reorder(@Body() body: ReorderLessonsDto) {
    return this.lessonService.reorder(body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateLessonDto) {
    return this.lessonService.update(id, body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.lessonService.delete(id);
  }
}
