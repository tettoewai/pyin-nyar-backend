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
import { AuthGuard } from "../auth/decorators/auth.guard.js";
import { RolesGuard } from "../auth/decorators/role.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CreateSubjectDto } from "./dto/create-subject.dto.js";
import { UpdateSubjectDto } from "./dto/update-subject.dto.js";
import { SubjectService } from "./subject.service.js";

@Controller("admin/subject")
export class SubjectAdminController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  get() {
    return this.subjectService.adminFindAll();
  }

  @Post("/")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(@Body() body: CreateSubjectDto) {
    return this.subjectService.create(body.name, body.code, body.grade);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: UpdateSubjectDto) {
    return this.subjectService.update(id, body.name, body.code, body.grade);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  delete(@Param("id") id: string) {
    return this.subjectService.delete(id);
  }
}
