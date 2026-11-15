import { AuthGuard } from "@/auth/decorators/auth.guard.js";
import { RolesGuard } from "@/auth/decorators/role.guard.js";
import { Roles } from "@/auth/decorators/roles.decorator.js";
import { CreateSubjectDto } from "@/subject/dto/create-subject.dto.js";
import { UpdateSubjectDto } from "@/subject/dto/update-subject.dto.js";
import { SubjectService } from "@/subject/subject.service.js";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

@Controller("admin/subject")
@UseGuards(AuthGuard, RolesGuard)
export class SubjectAdminController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get("/")
  @Roles("ADMIN")
  get() {
    return this.subjectService.adminFindAll();
  }

  @Post("/")
  @Roles("ADMIN")
  create(@Body() body: CreateSubjectDto) {
    return this.subjectService.create(body.name, body.code, body.grade);
  }

  @Patch(":id")
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateSubjectDto) {
    return this.subjectService.update(id, body.name, body.code, body.grade);
  }

  @Delete(":id")
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.subjectService.delete(id);
  }

  @Patch(":id/restore")
  @Roles("ADMIN")
  restore(@Param("id") id: string) {
    return this.subjectService.restore(id);
  }
}
