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
import { ChapterService } from "@/subject/chapter.service.js";
import { ChapterQueryDto } from "@/subject/dto/chapter/chapter-query.dto.js";
import { CreateChapterDto } from "@/subject/dto/chapter/create-chapter.dto.js";
import { UpdateChapterDto } from "@/subject/dto/chapter/update-chapter.dto.js";
import { MoveChapterDto } from "@/subject/dto/chapter/move-chapter.dto.js";
import { Throttle } from "@nestjs/throttler";

@Controller("admin/chapter")
@UseGuards(AuthGuard, RolesGuard)
export class ChapterAdminController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get("/")
  @Roles("ADMIN")
  getAll(@Query() query: ChapterQueryDto) {
    return this.chapterService.adminFindAll(query.subjectId);
  }

  @Get(":id")
  @Roles("ADMIN")
  getOne(@Param("id") id: string) {
    return this.chapterService.adminFindOne(id);
  }

  @Post("/")
  @Roles("ADMIN")
  create(@Body() body: CreateChapterDto) {
    return this.chapterService.create(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch("move")
  @Roles("ADMIN")
  reorder(@Body() body: MoveChapterDto) {
    return this.chapterService.moveChapter(body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateChapterDto) {
    return this.chapterService.update(id, body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.chapterService.delete(id);
  }

  @Patch("restore/:id")
  @Roles("ADMIN")
  restore(@Param("id") id: string) {
    return this.chapterService.restore(id);
  }
}
