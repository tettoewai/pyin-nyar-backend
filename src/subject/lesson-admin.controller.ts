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
import { AuthGuard } from "../auth/decorators/auth.guard.js";
import { RolesGuard } from "../auth/decorators/role.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CreateLessonDto } from "./dto/lesson/create-lesson.dto.js";
import { LessonQueryDto } from "./dto/lesson/lesson-query.dto.js";
import { ReorderLessonsDto } from "./dto/lesson/reorder-lessons.dto.js";
import { UpdateLessonDto } from "./dto/lesson/update-lesson.dto.js";
import { LessonService } from "./lesson.service.js";

@Controller("admin/lesson")
export class LessonAdminController {
  constructor(private readonly lessonService: LessonService) {}

  @Get("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getAll(@Query() query: LessonQueryDto) {
    return this.lessonService.adminFindAll(query.chapterId);
  }

  @Get(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getOne(@Param("id") id: string) {
    return this.lessonService.adminFindOne(id);
  }

  @Post("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(@Body() body: CreateLessonDto) {
    return this.lessonService.create(body);
  }

  @Patch("reorder")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  reorder(@Body() body: ReorderLessonsDto) {
    return this.lessonService.reorder(body);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateLessonDto) {
    return this.lessonService.update(id, body);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.lessonService.delete(id);
  }
}
