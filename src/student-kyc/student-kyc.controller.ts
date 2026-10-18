import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/decorators/auth.guard.js";
import { CurrentUser } from "../auth/decorators/user.decorator.js";
import type { AccessPayload } from "../auth/token.service.js";
import { CreateStudentKycDto } from "./dto/create-student-kyc.dto.js";
import { StudentKycService } from "./student-kyc.service.js";
import { UpdateStudentKycDto } from "./dto/update-student-kyc.dto.js";

@Controller("student-kyc")
@UseGuards(AuthGuard)
export class StudentKycController {
  constructor(private readonly studentKycService: StudentKycService) {}

  @Post()
  create(
    @CurrentUser() user: AccessPayload,
    @Body() createStudentKycDto: CreateStudentKycDto,
  ) {
    return this.studentKycService.create(user.sub, createStudentKycDto);
  }

  @Get("me")
  me(@CurrentUser() user: AccessPayload) {
    return this.studentKycService.findMine(user.sub);
  }

  @Patch("me")
  update(@CurrentUser() user: AccessPayload, @Body() dto: UpdateStudentKycDto) {
    return this.studentKycService.update(user.sub, dto);
  }
}
