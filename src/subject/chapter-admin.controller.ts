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
import { ChapterService } from "./chapter.service.js";
import { ChapterQueryDto } from "./dto/chapter/chapter-query.dto.js";
import { CreateChapterDto } from "./dto/chapter/create-chapter.dto.js";
import { UpdateChapterDto } from "./dto/chapter/update-chapter.dto.js";
import { MoveChapterDto } from "./dto/chapter/move-chapter.dto.js";
import { Throttle } from "@nestjs/throttler";

@Controller("admin/chapter")
export class ChapterAdminController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getAll(@Query() query: ChapterQueryDto) {
    return this.chapterService.adminFindAll(query.subjectId);
  }

  @Get(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getOne(@Param("id") id: string) {
    return this.chapterService.adminFindOne(id);
  }

  @Post("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(@Body() body: CreateChapterDto) {
    return this.chapterService.create(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch("move")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  reorder(@Body() body: MoveChapterDto) {
    return this.chapterService.moveChapter(body);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateChapterDto) {
    return this.chapterService.update(id, body);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.chapterService.delete(id);
  }

  @Patch("restore/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  restore(@Param("id") id: string) {
    return this.chapterService.restore(id);
  }
}
