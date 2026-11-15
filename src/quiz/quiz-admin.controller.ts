import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { QuizService } from "@/quiz/quiz.service.js";
import { AuthGuard } from "@/auth/decorators/auth.guard.js";
import { RolesGuard } from "@/auth/decorators/role.guard.js";
import { Roles } from "@/auth/decorators/roles.decorator.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { CurrentUser } from "@/auth/decorators/user.decorator.js";
import type { AccessPayload } from "@/auth/token.service.js";

@Controller("admin/quiz")
@UseGuards(AuthGuard, RolesGuard)
export class QuizAdminController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @Roles("ADMIN")
  async adminFindAll() {
    return this.quizService.adminFindAll();
  }

  @Post()
  @Roles("ADMIN")
  async create(
    @Body() body: CreateQuizDto,
    @CurrentUser() user: AccessPayload,
  ) {
    return this.quizService.create(body, user.sub);
  }
}
